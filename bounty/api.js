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
        const query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;";
        const result = await client.query('SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name',
              ['public']);
        const tables = result.rows.map(row => row.table_name);
        res.setHeader('Content-Type', 'application/json'); // Set Content-Type header
        res.json(tables);
        console.log(res.json(tables));
        console.log(result);
    } catch (err) {
        console.error('Error fetching tables:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const data = [
    { id: "", firstname: '', lastname: "", occupation:"" },
 
  ];

  //api enpoint to upload
app.post('/upload', (req, res) => {
    const { data, tableName } = req.body;
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
