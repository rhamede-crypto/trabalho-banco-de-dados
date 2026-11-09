import { test as base, expect } from "@playwright/test";
const test = base.extend({ locationAllowed: [false, { option: true }] });
const place = {
  id: "1",
  name: "Biblioteca Central",
  description: "Mesas e tomadas para estudar.",
  latitude: -3.7319,
  longitude: -38.5267,
};
test.beforeEach(async ({ page, locationAllowed }) => {
  await page.addInitScript(
    (allowed) =>
      Object.defineProperty(navigator, "geolocation", {
        value: {
          getCurrentPosition(success, error) {
            if (allowed)
              success({ coords: { latitude: -8.05, longitude: -34.9 } });
            else error({ code: 1 });
          },
        },
      }),
    locationAllowed,
  );
  // O provedor de mapas não é necessário para testar navegação e formulários.
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.fulfill({
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=",
        "base64",
      ),
    }),
  );
  await page.route("**/api/places?*", (route) =>
    route.fulfill({ json: { places: [place], truncated: false } }),
  );
});
test("lista locais, trata localização negada e consulta outra área ao mover mapa", async ({
  page,
}) => {
  const queries = [];
  page.on("request", (req) => {
    if (req.url().includes("/api/places?"))
      queries.push(new URL(req.url()).search);
  });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: /Biblioteca Central/ }),
  ).toBeVisible();
  await expect(page.locator("#location-status")).toContainText(
    "Permissão de localização negada",
  );
  await page.locator("#map").focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => new Set(queries).size).toBeGreaterThan(1);
  await page.getByRole("button", { name: /Biblioteca Central/ }).click();
  await expect(page.locator(".leaflet-popup-content")).toContainText(
    "Mesas e tomadas",
  );
});
test.describe("permissão concedida", () => {
  test.use({ locationAllowed: true });
  test("centraliza na localização real quando há permissão", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("#location-status")).toHaveText(
      "Mapa centralizado na sua localização.",
    );
    await expect
      .poll(() => page.locator("#list-status").textContent())
      .toContain("encontrado");
  });
});
test("cadastra com seleção pelo centro do mapa e atualiza a lista", async ({
  page,
}) => {
  let saved;
  await page.route("**/api/places", async (route) => {
    saved = route.request().postDataJSON();
    await route.fulfill({ status: 201, json: { id: "2", ...saved } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Novo local" }).click();
  await page.getByLabel("Nome do local").fill("Sala de leitura");
  await page
    .getByLabel("O que você encontra por lá?")
    .fill("Silêncio e mesas.");
  await page.getByRole("button", { name: "Salvar local" }).click();
  await expect(page.locator("#form-status")).toContainText(
    "Selecione um ponto",
  );
  await page.getByRole("button", { name: "Usar o centro do mapa" }).click();
  await page.getByRole("button", { name: "Salvar local" }).click();
  await expect(page.locator("#toast")).toContainText("Local cadastrado");
  expect(saved.name).toBe("Sala de leitura");
  expect(saved.latitude).toBeCloseTo(-3.73, 1);
  expect(saved.longitude).toBeCloseTo(-38.53, 1);
  await expect(page.locator("#editor-panel")).toBeHidden();
});
test("erro ao salvar preserva formulário e permite cancelar", async ({
  page,
}) => {
  await page.route("**/api/places", (route) =>
    route.fulfill({ status: 503, json: { error: "Banco indisponível." } }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Novo local" }).click();
  await page.getByLabel("Nome do local").fill("Meu local");
  await page.getByRole("button", { name: "Usar o centro do mapa" }).click();
  await page.getByRole("button", { name: "Salvar local" }).click();
  await expect(page.locator("#form-status")).toHaveText("Banco indisponível.");
  await expect(page.getByLabel("Nome do local")).toHaveValue("Meu local");
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(page.locator("#explore-panel")).toBeVisible();
});
test("seleciona ponto clicando no mapa", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Novo local" }).click();
  await page.locator("#map").click({ position: { x: 170, y: 160 } });
  await expect(page.locator("#selected-position")).toContainText(
    "posição selecionada",
  );
});
test("trata erro com retry, estado vazio e limite de resultados", async ({
  page,
}) => {
  await page.route("**/api/places?*", (route) =>
    route.fulfill({ status: 503, json: { error: "Banco não configurado." } }),
  );
  await page.goto("/");
  await expect(page.locator("#list-status")).toHaveText(
    "Banco não configurado.",
  );
  await page.route("**/api/places?*", (route) =>
    route.fulfill({ json: { places: [], truncated: false } }),
  );
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.locator("#empty-state")).toBeVisible();
  await page.route("**/api/places?*", (route) =>
    route.fulfill({ json: { places: [place], truncated: true } }),
  );
  await page.locator("#map").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#list-status")).toContainText("Aproxime o mapa");
});
test("dados recebidos são texto e interface não transborda no celular", async ({
  page,
}) => {
  await page.route("**/api/places?*", (route) =>
    route.fulfill({
      json: {
        places: [
          {
            ...place,
            name: "<img src=x onerror=alert(1)>",
            description: "<script>alert(1)</script>",
          },
        ],
        truncated: false,
      },
    }),
  );
  await page.goto("/");
  await expect(page.locator(".place-copy strong")).toHaveText(
    "<img src=x onerror=alert(1)>",
  );
  await expect(page.locator(".place-copy img")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("resposta atrasada não substitui a área atual do mapa", async ({
  page,
}) => {
  let release;
  const waiting = new Promise((resolve) => (release = resolve));
  let calls = 0;
  await page.route("**/api/places?*", async (route) => {
    if (++calls === 1) {
      await waiting;
      await route
        .fulfill({
          json: {
            places: [{ ...place, name: "Área antiga" }],
            truncated: false,
          },
        })
        .catch(() => {});
    } else
      await route.fulfill({
        json: { places: [{ ...place, name: "Área atual" }], truncated: false },
      });
  });
  await page.goto("/");
  await expect.poll(() => calls).toBe(1);
  await page.locator("#map").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".place-copy strong")).toHaveText("Área atual");
  release();
  await expect(page.locator(".place-copy strong")).toHaveText("Área atual");
});

test('edita local existente e atualiza lista', async ({page}) => {
  let saved;
  await page.route('**/api/places/1',async route=>{
    saved=route.request().postDataJSON();
    await page.route('**/api/places?*',r=>r.fulfill({json:{places:[{id:'1',...saved}],truncated:false}}));
    await route.fulfill({json:{id:'1',...saved}});
  });
  await page.goto('/');
  await page.getByRole('button',{name:'Editar local',exact:true}).click();
  await expect(page.getByLabel('Nome do local')).toHaveValue('Biblioteca Central');
  await page.getByLabel('Nome do local').fill('Biblioteca renovada');
  await page.getByRole('button',{name:'Salvar alterações'}).click();
  await expect(page.locator('#toast')).toHaveText('Local atualizado com sucesso.');
  expect(saved.name).toBe('Biblioteca renovada');
  await expect(page.locator('.place-copy strong')).toHaveText('Biblioteca renovada');
});

test('exclusão exige confirmação e remove o local da lista',async({page})=>{
  let deletes=0;
  await page.route('**/api/places/1',async route=>{
    ++deletes;
    await page.route('**/api/places?*',r=>r.fulfill({json:{places:[],truncated:false}}));
    await route.fulfill({status:204});
  });
  await page.goto('/');await page.getByRole('button',{name:'Editar local',exact:true}).click();
  page.once('dialog',dialog=>dialog.dismiss());
  await page.getByRole('button',{name:'Excluir local',exact:true}).click();
  expect(deletes).toBe(0);
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Excluir local',exact:true}).click();
  await expect(page.locator('#toast')).toHaveText('Local excluído com sucesso.');
  await expect(page.locator('#empty-state')).toBeVisible();expect(deletes).toBe(1);
});

test('busca endereço somente ao enviar e seleciona sem salvar automaticamente',async({page})=>{
  let searches=0,creates=0;
  await page.route('**/api/places',r=>{++creates;return r.fulfill({status:201,json:{}});});
  await page.route('https://nominatim.openstreetmap.org/search?*',r=>{++searches;return r.fulfill({json:[{display_name:'Biblioteca do Centro',lat:'-3.72',lon:'-38.52'}]});});
  await page.goto('/');await page.getByRole('button',{name:'Novo local'}).click();
  await page.getByLabel('Buscar endereço', {exact:true}).fill('Biblioteca Fortaleza');
  expect(searches).toBe(0);
  await page.getByRole('button',{name:'Buscar endereço',exact:true}).click();
  await page.getByRole('button',{name:'Biblioteca do Centro',exact:true}).click();
  await expect(page.locator('#selected-position')).toContainText('-3.72000, -38.52000');
  expect(searches).toBe(1);expect(creates).toBe(0);
});

test('busca trata serviço indisponível e nova tentativa',async({page})=>{
  await page.route('https://nominatim.openstreetmap.org/search?*',r=>r.fulfill({status:503,json:{}}));
  await page.goto('/');await page.getByRole('button',{name:'Novo local'}).click();
  await page.getByLabel('Buscar endereço',{exact:true}).fill('Fortaleza');
  await page.getByRole('button',{name:'Buscar endereço',exact:true}).click();
  await expect(page.locator('#search-status')).toContainText('indisponível');
  await page.getByRole('button',{name:'Cancelar',exact:true}).click();
  await page.getByRole('button',{name:'Novo local'}).click();
  await page.getByLabel('Buscar endereço',{exact:true}).fill('Fortaleza');
  await page.getByRole('button',{name:'Buscar endereço',exact:true}).click();
  await expect(page.locator('#search-status')).not.toHaveText('Buscando endereços…');
});
