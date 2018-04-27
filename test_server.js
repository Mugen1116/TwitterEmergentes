const axios = require('axios');

let client = axios.create({
  baseURL: 'http://localhost:8080/',
  timeout: 1000,
});

client.get("/datasets")
      .then(response => console.log(response.data))
      .catch(error => console.log(error));

client.get("/dataset/coches?n=2")
      .then(response => console.log(response.data))
      .catch(error => console.log(error));  
