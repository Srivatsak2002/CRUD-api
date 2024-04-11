const client = require('./connection.js')
const express = require('express');
const app = express();

app.use(express.json());

app.listen(3400, ()=>{
    console.log("Sever is now listening at port 3400");
})

client.connect();

/*
app.get('/v1/datasets/:id', (req, res)=>{
    client.query(`SELECT * FROM datasets where id='${req.params.id}';`, (err, result)=>{
        if(!err){
            res.send(result.rows);
        }
    });
    client.end;
})
*/

/*
app.get('/v1/datasets/:id', (req, res) => {
    const id = req.params.id; 
    const query = 'SELECT * FROM datasets WHERE id = $1;'; 

    client.query(query, [id], (err, result) => {
        if (!err) {
            res.send(result.rows);
        } else {
            console.error(err.message);
            res.send('Error occurred while fetching dataset');
        }
    });
});
*/

app.get('/v1/datasets/:id', (req, res) => {
    const id = req.params.id; 
    const query = 'SELECT * FROM datasets WHERE id = $1;'; 

    client.query(query, [id], (err, result) => {
        if (!err) {
            if (result.rows.length === 0) {
                res.status(404).send('Data not found');
            } else {
                res.send(result.rows);
            }
        } else {
            console.error(err.message);
            res.send('Error occurred while fetching dataset');
        }
    });
});





app.get('/v1/datasets', (req, res)=>{
    client.query(`SELECT * FROM datasets;`, (err, result)=>{
        if(!err){
            res.send(result.rows);
        }
    });
    client.end;
})


app.post('/v1/datasets', (req, res) => {
    const datasetData = req.body;

    const missingFields = [];
    if (!datasetData.id) {
        missingFields.push('id');
    }
    if (!datasetData.type) {
        missingFields.push('type');
    }
    if (!datasetData.updated_date) {
        missingFields.push('updated_date');
    }

    if (missingFields.length > 0) {
        return res.status(400).send(`Please provide values for the following required fields: ${missingFields.join(', ')}`);
    }

    const insertQuery = `INSERT INTO datasets (id, dataset_id, type, name, validation_config, extraction_config, 
                        dedup_config, data_schema, denorm_config, router_config, dataset_config, status, tags, 
                        data_version, created_by, updated_by, created_date, updated_date, published_date) 
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19);`;

    const values = [
        datasetData.id,
        datasetData.dataset_id || null,
        datasetData.type,
        datasetData.name || null,
        datasetData.validation_config || null,
        datasetData.extraction_config || null,
        datasetData.dedup_config || null,
        datasetData.data_schema || null,
        datasetData.denorm_config || null,
        datasetData.router_config || null,
        datasetData.dataset_config || null,
        datasetData.status || null,
        datasetData.tags || null,
        datasetData.data_version || null,
        datasetData.created_by || null,
        datasetData.updated_by || null,
        datasetData.created_date || new Date(),
        datasetData.updated_date,
        datasetData.published_date || new Date() 
    ];

    client.query(insertQuery, values, (err, result) => {
        if (!err) {
            res.send('Insertion was successful');
        } else {
            console.error(err.message);
            res.send(err.message);
           // res.send('Error occurred during insertion');
        }
    });
});

//console.log(new Date());

app.put('/v1/datasets/:id', (req, res) => {
    //const newid = req.params.dataset_id;
    //const id = req.params.id;
    const updatedFields = req.body;
    if (Object.keys(updatedFields).length === 0) {
        return res.send('Please provide at least one field to update');
    }

    let setClause = '';
    const values = [];
    Object.keys(updatedFields).forEach((key, index) => {
        if (index > 0) {
            setClause += ', ';
        }
        setClause += `${key} = $${index + 1}`;
        values.push(updatedFields[key]);
    });

    const updateQuery = `UPDATE datasets SET ${setClause} WHERE id='${req.params.id}';`;
    client.query(updateQuery, values, (err, result) => {
        if (!err) {
            res.send('Update was successful');
        } else {
            console.error(err.message);
            res.send('Error occurred during update');
        }
    });
});



app.patch('/v1/datasets/:id', (req, res) => {
    const updatedFields = req.body;
    const id=req.params.id;
    if (Object.keys(updatedFields).length === 0) {
        return res.send('Please provide at least one field to update');
    }

    let setClause = '';
    const values = [];
    Object.keys(updatedFields).forEach((key, index) => {
        if (index > 0) {
            setClause += ', ';
        }
        setClause += `${key} = $${index + 1}`;
        values.push(updatedFields[key]);
    });

    const updateQuery = `UPDATE datasets SET ${setClause} WHERE id = '${id}';`;

    client.query(updateQuery, values, (err, result) => {
        if (!err) {
            res.send('Update was successful');
        } else {
            console.error(err.message);
            res.send('Error occurred during update');
        }
    });
});



app.delete('/v1/datasets/:id', (req, res) => {
    const datasetsId = req.params.id; 

    const deleteQuery = `DELETE FROM datasets WHERE id = '${datasetsId}';`;

    client.query(deleteQuery, (err, result) => {
        if (!err) {
            res.send({
                "id": "api.dataset.delete",
                "ver": "1.0",
                "ts": new Date(),
                "params": {
                    "err": null,
                    "status": "successful",
                    "errmsg": null

                },
                "responseCode": "OK",
                "result": {
                    "id": datasetsId
                }
            });
        } else {
            //console.error(err.message);
            res.status(500).send({
                "id": "api.dataset.delete",
                "ver": "1.0",
                "ts": new Date(),
                "params": {
                    "err": "Database Error",
                    "status": "unsuccessful",
                    "errmsg": err.message
                },
                "responseCode": "INTERNAL_SERVER_ERROR",
                "result": null
            });
        }
    });
});
