const request = require('supertest');
const app = require('../../src/app');

describe('Health Endpoints', ()=> {
  it('should return 200 on health check',async()=>{
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status','ok');
  });
});
