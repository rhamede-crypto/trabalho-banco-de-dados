import {test} from 'node:test';
import assert from 'node:assert/strict';
import {radiusInMeters,proximityQuery,formatDistance} from '../public/proximity.js';
test('converte quilômetros e rejeita raios fora do limite',()=>{
  assert.equal(radiusInMeters('2'),2000);
  assert.equal(radiusInMeters('0.001'),1);
  assert.equal(radiusInMeters('50'),50000);
  for(const value of ['',0,-1,51,'abc']) assert.throws(()=>radiusInMeters(value));
});
test('consulta usa coordenadas do usuário e distância em metros',()=>{
  const url=new URL(proximityQuery({longitude:-34.9,latitude:-8.05},2000),'http://localhost');
  assert.deepEqual(Object.fromEntries(url.searchParams),{longitude:'-34.9',latitude:'-8.05',radius:'2000'});
  assert.equal(formatDistance(125),'125 m');assert.equal(formatDistance(1500),'1,5 km');
});
