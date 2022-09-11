const express = require('express');
const router = express.Router();
const mongoose = require('mongoose')
const ClothingItem = mongoose.model("ClothingItem")
const {check, validationResult } = require('express-validator');


router.get('/add',(req,res)=>{
    res.render("add")
})

router.post('/add',
    [
    check('name','This name must be more than 3 characters long').exists().isLength({min:3}),
    check('imgUrl','This is an invalid Image Link, Try Copy Address').exists().isURL(),
    check('storeLink',"This is an invalid Link").exists().isURL()
    ]
,(req,res)=>{
    const errors = validationResult(req)
    if(errors.isEmpty()){
        const {name,category,imgUrl,storeLink} = req.body
        const votes = 0
        const inSet = false
        const liked = false 
        const addedItem = new ClothingItem({name,category,storeLink,imgUrl,votes,inSet,liked})
        addedItem.save(function(err){
            if(err){
                console.log(err)
            }
            res.render("add", {"message": "item was succesfully added"})
        })
    }
    else{
        const alert = errors.array()
        res.render('add',{"alert" : alert}) 
    }
    
});

router.get("/liked", async (req,res) =>{
    const user = req.user
    const items = await ClothingItem.find({_id:{$in: user.likedItems}}).exec()  
    res.render("liked",{"items":items})
})

module.exports = router;
