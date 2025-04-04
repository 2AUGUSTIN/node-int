const port = 4000;
const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = express();
dotenv.config();


app.use(express.json());

const db = mysql.createConnection({
    host: process.env.HOST || "localhost",
    user: process.env.USER || "root",
    password: process.env.PASSWORD || "",
    database: process.env.DB || "task management",
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("Database connection completed");
    }
});

const autheticate = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(403).json({ message: "not authorized" });

    jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
        if (error) return res.status(400).json({ error: error.message });
        req.user = decoded.id;
        next();
    })
}

app.post('/api/insert', (req, res) => {
    const { username, password } = req.body;
    const insert = "insert into users (username,password) values(?,?) "
    db.query(insert, [username, password], (error, result) => {
        if (error) return res.status(400).json({ error: error.message });
        return res.status(200).json({ message: 'user inserted well' });
    });
});

app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const login = "select * from users where username=?";
    db.query(login, [username], (error, result) => {
        if (error) return res.status(400).json({ error: error.message });
        if (result == 0) return res.status(500).json({ message: "can't found user" });
        const user = result[0];
        const match = bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: "invalid password" })

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        )
        res.json(token);
    });
});

app.post('/api/task/insert/', autheticate, (req, res) => {

    const { title, describiton} = req.body;
    const sql = "insert into task (title,describiton,author,created_at,updated_at) values(?,?,?,?,?)";
    db.query(sql, [title, describiton, req.user, new Date(), new Date()], (error, result) => {
        if (error) return res.status(400).json({ error: error.message });
        return res.json({ messege: " task added" });
    });
});



app.patch("/api/task/update/:id",autheticate,(req,res)=>{
    const {title,describiton}=req.body;
    console.log(title,"+", describiton);
    const {id}=req.params;


    if(!id) return res.status(404).json({message:"id not found"});

db.query("SELECT * FROM task where id=?",[id],(error,result)=>{
    if (error) return res.status(400).json({ error: error.message });
    const db_data=result[0];
    if(req.user != db_data.author) return res.status(400).json({error:"you arenot authorizade"})

        const ql="UPDATE  task set title=?, describiton=?,updated_at=? where id=?";
        console.log(title,"-", describiton);
db.query(ql,[title,describiton,new Date(),id],(error,result)=>{
    if (error) return res.status(400).json({ error: error.message });
    
return res.status(200).json({message:` task ${id} updated well`})


});
    })
});

app.delete('/api/task/delete/:id',autheticate,(req,res)=>{
const  {id}=req.params;
if(!id) return res.status(404).json({message:"id not found"});
        const sql="delete from task where id=? AND author=?";
        db.query(sql,[id,req.user],(error,result)=>{
            if (error) return res.status(400).json({ error: error.message });
            return res.status(200).json({message:` task ${id} deleted well`})
        })

    });

    app.get('/api/task/get', autheticate, (req, res) => {
        const get = "select * from task where author=?";
        db.query(get, [req.user],(error, result) => {
            if (error) return res.status(400).json({ error: error.message });
            return res.json(result);
           });
    });
    app.listen(port, () => {
    console.log(`server is listen on port ${port}`);
})