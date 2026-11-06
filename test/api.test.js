import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
async function withApi(db, run, configured = true) {
  const server = createApp(db, configured).listen(0,'127.0.0.1');
  await new Promise(resolve => server.once('listening',resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve=>server.close(resolve)); }
}
test('sem configuração: health e API informam indisponibilidade', async () => {
  await withApi({}, async url => {
    for(const path of ['/api/health','/api/places']) assert.equal((await fetch(url+path)).status,503);
  },false);
});
test('rejeita coordenadas e áreas inválidas antes de consultar banco', async () => {
  await withApi({query(){throw new Error('Não deveria consultar');}},async url => {
    assert.equal((await fetch(url+'/api/places')).status,400);
    assert.equal((await fetch(url+'/api/places?west=0&east=1&south=10&north=0')).status,400);
    const res = await fetch(url+'/api/places',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Biblioteca',latitude:91,longitude:0})});
    assert.equal(res.status,400);
  });
});
test('CRUD usa parâmetros, longitude antes da latitude e respostas esperadas', async () => {
  const calls=[];
  const row={id:'1',name:'Biblioteca',description:'Silenciosa',longitude:-38.5,latitude:-3.7};
  const db={async query(sql,values){calls.push({sql,values});return {rows:[row],rowCount:1};}};
  await withApi(db,async url=>{
    const options={headers:{'Content-Type':'application/json'},body:JSON.stringify(row)};
    assert.equal((await fetch(url+'/api/places',{...options,method:'POST'})).status,201);
    assert.deepEqual(calls.at(-1).values,['Biblioteca','Silenciosa',-38.5,-3.7]);
    assert.equal((await fetch(url+'/api/places/1',{...options,method:'PUT'})).status,200);
    assert.equal((await fetch(url+'/api/places/1',{method:'DELETE'})).status,204);
  });
});
test('filtros espaciais e limite indicam resultados truncados',async()=>{
  const calls=[];
  await withApi({async query(sql,values){calls.push({sql,values});return {rows:Array.from({length:501},(_,i)=>({id:String(i)}))};}},async url=>{
    const res=await fetch(url+'/api/places?longitude=-38&latitude=-3&radius=2000');
    const body=await res.json();assert.equal(body.places.length,500);assert.equal(body.truncated,true);
    assert.match(calls.at(-1).sql,/ST_DWithin/);assert.deepEqual(calls.at(-1).values,[-38,-3,2000]);
    await fetch(url+'/api/places?west=-39&east=-38&south=-4&north=-3');
    assert.match(calls.at(-1).sql,/ST_Intersects/);
    await fetch(url+'/api/places?west=170&east=-170&south=-4&north=4');
    assert.match(calls.at(-1).sql,/OR ST_X/);
  });
});
test('recurso inexistente retorna 404 e falha do banco não expõe detalhes',async()=>{
  await withApi({async query(){return {rows:[],rowCount:0};}},async url=>assert.equal((await fetch(url+'/api/places/1',{method:'DELETE'})).status,404));
  await withApi({async query(){throw new Error('senha privada');}},async url=>{
    const res=await fetch(url+'/api/places?west=0&east=1&south=0&north=1');
    assert.equal(res.status,503);assert.doesNotMatch(await res.text(),/senha privada/);
  });
});
