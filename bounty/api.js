const client = require("./connection.js")
const express = require("express");
const bodyParser = require("body-parser");
const app =  express();

const cors = require("cors");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.listen(3300, () => {
   console.log("server is now listening at port 3300");
})

client.connect();
app.use(cors()); 

//api endpoint to get list of all users in the table users
app.get('/users', (req, res) => {
    client.query("Select * from users", (err, result) => {

        if(!err){
            res.send(result.rows);
        }
    });
    client.end;

})  

//api endpoint to get the list of all tables in the postgres database
app.get('/tables', async (req, res) => {
  try {
      const query = `
          SELECT jsonb_agg(table_name) AS tables
          FROM (
              SELECT table_name
              FROM information_schema.tables
              WHERE table_schema = 'public'
              ORDER BY table_name
          ) AS table_names;
      `;
      const result = await client.query(query);
      const tables = result.rows[0].tables;
      res.setHeader('Content-Type', 'application/json');
      res.json(tables);
  } catch (err) {
      console.error('Error fetching tables:', err);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

//api to run prompts against different tables
app.get('/runPrompt/:tableName', (req, res) => {
  const { tableName } = req.params;
  const { prompt } = req.body;
  const query = `
    SELECT jsonb_agg(json_build_object(
        'id', id,
        'address', address,
        'lastname', lastname,
        'firstname', firstname
    )) AS result
    FROM ${tableName}
    WHERE ${prompt};
`;
  client.query(query, (err, result) => {
      if (err) {
          console.error('Error running prompt:', err);
          res.status(500).send('Internal Server Error');
          return;
      }
      res.send(result.rows);
  });
});

//api endpoint to upload
app.post('/upload/:tableName', (req, res) => {
  const { tableName } = req.params;
  const { data } = req.body;
  const keys = Object.keys(data[0]);
  const values = data.map(item => Object.values(item));
  const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${keys.map(key => `${key} TEXT`).join(', ')});`;

  client.query(query, (err, result) => {
    if (err) {
      console.error('Error creating table:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    const insertQuery = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${values.map((_, index) => keys.map((_, i) => `$${index * keys.length + i + 1}`).join(', ')).join('), (')});`;

    client.query(insertQuery, values.flat(), (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
      res.send('Data inserted successfully');
    });
  });
});