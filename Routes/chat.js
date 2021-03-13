const route=require('express').Router()

route.get('/',(req,res)=>{
    res.send("Chat")
})

module.exports=route
