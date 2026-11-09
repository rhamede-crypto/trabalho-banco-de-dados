import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { createApp } from "../src/app.js";

test("CRUD e consultas espaciais com PostGIS real", async (t) => {
  assert.ok(
    process.env.TEST_DATABASE_URL,
    "Defina TEST_DATABASE_URL para um banco de testes com permissão de criar schema e extensão PostGIS.",
  );
  const admin = new pg.Pool({
    connectionString: process.env.TEST_DATABASE_URL,
  });
  const schema = `check_${randomUUID().replaceAll("-", "")}`;
  let pool, server;
  try {
    await admin.query(
      "CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public",
    );
    await admin.query(`CREATE SCHEMA ${schema}`);
    pool = new pg.Pool({
      connectionString: process.env.TEST_DATABASE_URL,
      options: `-c search_path=${schema},public`,
    });
    const sql = await readFile(
      new URL("../db/schema.sql", import.meta.url),
      "utf8",
    );
    await pool.query(sql);
    server = createApp(pool).listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    const url = `http://127.0.0.1:${server.address().port}`;
    const send = (path, method, body) =>
      fetch(url + path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    let id;
    await t.test(
      "cria ponto espacial e setup repetido preserva dados",
      async () => {
        const res = await send("/api/places", "POST", {
          name: "Biblioteca",
          description: "Estudo",
          latitude: -3.73,
          longitude: -38.53,
        });
        assert.equal(res.status, 201);
        id = (await res.json()).id;
        await pool.query(sql);
        const { rows } = await pool.query(
          "SELECT ST_GeometryType(location::geometry) AS type, ST_SRID(location::geometry) AS srid FROM places",
        );
        assert.deepEqual(rows, [{ type: "ST_Point", srid: 4326 }]);
      },
    );
    await t.test("filtra por metros e pela área visível", async () => {
      await send("/api/places", "POST", {
        name: "Longe",
        latitude: -8,
        longitude: -35,
      });
      const nearby = await (
        await fetch(
          url + "/api/places?longitude=-38.53&latitude=-3.73&radius=2000",
        )
      ).json();
      assert.equal(nearby.places.length, 1);
      assert.equal(nearby.places[0].id, id);
      assert.equal(nearby.places[0].distance, 0);
      const viewport = await (
        await fetch(url + "/api/places?west=-39&east=-38&south=-4&north=-3")
      ).json();
      assert.deepEqual(
        viewport.places.map((p) => p.id),
        [id],
      );
      const empty = await (
        await fetch(url + "/api/places?west=10&east=11&south=10&north=11")
      ).json();
      assert.equal(empty.places.length, 0);
      await send("/api/places", "POST", {
        name: "Ilha",
        latitude: 0,
        longitude: -179,
      });
      const wrapped = await (
        await fetch(url + "/api/places?west=170&east=-170&south=-1&north=1")
      ).json();
      assert.deepEqual(
        wrapped.places.map((p) => p.name),
        ["Ilha"],
      );
    });
    await t.test("atualiza e remove o local persistido", async () => {
      const response = await send(`/api/places/${id}`, "PUT", {
        name: "Sala",
        description: "Atualizada",
        latitude: -3.75,
        longitude: -38.55,
      });
      assert.equal(response.status, 200);
      assert.equal((await response.json()).name, "Sala");
      assert.equal(
        (await fetch(url + `/api/places/${id}`, { method: "DELETE" })).status,
        204,
      );
      assert.equal(
        (await fetch(url + `/api/places/${id}`, { method: "DELETE" })).status,
        404,
      );
      assert.equal((await fetch(url + "/api/health")).status, 200);
    });
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (pool) await pool.end();
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await admin.end();
  }
});
