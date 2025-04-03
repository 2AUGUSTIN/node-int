const port=5000;
const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const bcrypt=require("bcryptjs");
const jwt = require("jsonwebtoken");
const app=express();
dotenv.config();


app.use(express.json());

const db = mysql.createConnection({
    host: process.env.HOST || "localhost",
    user: process.env.USER || "root",
    password: process.env.PASSWORD || "",
    database: process.env.DB || "task management",
});

db.connect((err) => {
    if (err){
        console.error("Database connection failed:", err.message);
    } else {
        console.log("Database connection completed");
    }
});

const autheticate=(req,res,next)=>{
const token=req.headers['authorization'];
if(!token) return res.status(403).json({message:"not authorized"});

jwt.verify(token,process.env.JWT_SECRET ,(error,decoded)=>{
if(error) return res.status(400).json({error:error.message});
req.userid=decoded.id;
next();
})
}

app.post('/api/insert',(req,res)=>{
const {username,password}=req.body;
const insert="insert into users (username,password) values(?,?) "
db.query(insert,[username,password],(error,result)=>{
if(error) return res.status(400).json({error:error.message});
return res.status(200).json({message:'user inserted well'});
});
});

app.post ("/api/login",(req,res)=>{
const {username,password}=req.body;
const login="select * from users where username=?";
db.query(login,[username],(error,result)=>{
    if(error) return res.status(400).json({error:error.message});
if(result==0) return res.status(500).json({message:"can't found user"});
const user=result[0];
const match=bcrypt.compare(password,user.password);
if(!match) return res.status(401).json({error:"invalid password"})

    const token=jwt.sign({id:user.id},process.env.JWT_SECRET,
        {
            expiresIn:"15min"
        }
    )
     res.json(token);
});
});

app.listen(port,()=>{
    console.log(`server is listen on port ${port}`);
})