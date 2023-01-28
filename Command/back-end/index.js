const express = require('express')
const mysql = require('mysql')
const cors = require('cors')
var path = require('path')
app = express()
app.use(cors())
port = 5000

var bodyParser = require('body-parser');
//var fileUpload = require('express-fileupload');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/public')));
//Connect to DB
const connection = mysql.createConnection({
    host:"localhost",
    database:"sensordata",
    user:"root",
})

//Run the express app
app.listen(port,(err)=>err?console.log(err):console.log(`Server Running on port ${port}`))

//Connect to DB 
connection.connect(err=>{err?console.log(err):console.log("Connection to database OK")})

//Create ROUTE that specifies REQUEST type or method

app.get('/', (req,res)=>{
    res.redirect('/data');
});

app.get('/data', (req,res)=>{
    res.sendFile('/Users/itimu/OneDrive/FinalProject/back-end/views/index.html');
});

/*app.get('/data/aliens',(req,res)=>{
    connection.query('SELECT * FROM aliens',(err,rows)=>{
        err?res.send(err):res.send(rows);
    });
});*/

app.get('/data/commands', (req, res)=>{
    connection.query('SELECT * FROM `commands` WHERE readfrom = 0',(err,rows)=>{
        err?res.send(err):res.send(rows);
    })
    connection.query('UPDATE `commands` SET readfrom = "1" WHERE readfrom = "0"');
})

app.get('/data/:table',(req,res)=>{
    var table = req.params.table;
    connection.query('SELECT * FROM `'+ connection.escape(table).slice(1,-1) +'` ORDER BY id DESC LIMIT 1',(err,rows)=>{
        err?res.send(err):res.send(rows);
    });
});

app.post('/data/battery',(req,res)=>{
    var health = req.body.Health
    const sql = 'INSERT INTO `battery`(`id`,`Health`) VALUES ("","'+health+'")';
    connection.query(sql)
    res.send("received health")
})

app.post('/data/location',(req,res)=>{
    var coordx = req.body.Location.x
    var coordy = req.body.Location.y
    var angle = req.body.angle
    var finished = req.body.finished
    const sql = 'INSERT INTO `location`(`ID`,`Location`,`angle`,`finished`) VALUES ("",POINT('+coordx+','+coordy+'), '+angle+', '+finished+')';
    connection.query(sql)
    res.send("received Location: "+JSON.stringify(req.body.Location)+" Angle: "+JSON.stringify(angle))
})

app.post('/data/aliens',(req,res)=>{
    var coordx = req.body.Location.x
    var coordy = req.body.Location.y
    var type = req.body.type
    var colour = req.body.Colour
    const sql = 'INSERT INTO `aliens`(`ID`,`type`,`Location`,`Colour`) VALUES ("","'+type+'",POINT('+coordx+','+coordy+'),"'+colour+'")';
    connection.query(sql)
    res.send("received alien coords")
})

app.post('/data/commands', (req, res)=>{
    var type = req.body.type;
    var input = req.body.input;
    //var speed = req.body.speed;
    const sql = 'INSERT INTO `commands`(`id`,`type`,`input`,`readfrom`) VALUES ("","'+type+'","'+input+'","0")';
    connection.query(sql, (err,data)=>{
        err?res.send(err):res.send(data);
    });
})

app.post('/data',(req,res)=>{
    var type = req.body.type;
        const sql = 'DELETE FROM `'+type+'`';
        connection.query(sql, (err,data)=>{
            err?res.send(err):res.send(data);
        });
        
    
})


