require('./db');
require('./auth');
const authRouter = require('./routes/auth')
const passport = require('passport');
const express = require('express');
const mongoose = require('mongoose')
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000; //if heroku gives us a port or if running locally
const ClothingItem = mongoose.model("ClothingItem")
const Set = mongoose.model("Set")

let contextObj;//used in post

// enable sessions
const session = require('express-session');
const sessionOptions = {
    secret: 'secret cookie thang (store this elsewhere!)',
    resave: true,
    saveUninitialized: true
};
app.use(session(sessionOptions));

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

app.use(passport.initialize())
//app.use(passport.session()) //ask about this
app.use(passport.authenticate('session'));


// make user data available to all templates
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
const userRoutes = require('./userRoutes.js');

app.use((req,res,next) => {
  console.log(req.method,req.path)
  next()
})

app.use('/user',userRoutes)
app.use('/auth',authRouter)

app.get("/", (req,res)=>{
  res.redirect("/set")
})

app.get("/set", async (req,res) => {
  if(!req.session.seenSets){
    req.session.seenSets = []
  }
  if(!req.session.likedItems){
    req.session.likedItems = []
  }
  let seenSets = []
  if(req.user){
    seenSets = req.user.seenSets
  }
  else{
    seenSets = req.session.seenSets
  }
  let currSet = await Set.findOne({_id: {$nin: seenSets}}).exec()
  let itemIds = []
  if (currSet === null){
      const items = await ClothingItem.find({inSet : false}).limit(4).exec()
      if(items.length < 4){
        return res.redirect("/noSet")
      }
      else {
        console.log("hello im here")
        currSet = new Set({itemIds})
        for(const item of items){
          item.inSet = true
          item.set = currSet._id
          item.votes = 0
          await item.save()
          currSet.items.push(item.id)
        }
        await currSet.save()
        itemIds = [] //resetItemIds
      }
  }
  const ids = currSet.items
  const items = await ClothingItem.find({_id: {$in: ids}}).exec()
  res.render("set", {"items" : items})
})

app.get("/noSet", (req,res)=>{
  res.render("noSet")
})

app.post("/set", async (req,res)=> {
  if(!req.session.seenSets){
    req.session.seenSets = []
  }
  if(!req.session.likedItems){
    req.session.likedItems = []
  }
  let seenSets = []
  if(req.user){
    seenSets = req.user.seenSets
  }
  else{
    seenSets = req.session.seenSets
  } 
  let currSet = await Set.findOne({_id:{$nin:seenSets}}).exec()
  if (currSet === null){
      const items = await ClothingItem.find({inSet : false}).limit(4).exec()
      if(items.length < 4){
        return res.redirect("/noSet")
      }
      else {
        currSet = new Set([])
        for(const item of items){
          item.inSet = true
          item.set = currSet._id
          item.votes = 0
          await item.save()
          currSet.items.push(item.id)
        }
        await currSet.save()
      }
  }
  res.redirect("/set")
})

app.get("/result", (req,res) =>{
  res.render("result", {"items" : contextObj})
})

app.post("/result", async (req,res)=>{
  const objectId = req.body._id
  const item = await ClothingItem.findOne({_id : objectId}).exec()
  item.votes += 1
  await item.save()
  const set = await Set.findOne({_id:item.set}).exec()
  await set.save()
  if(req.session.seenSets){
    req.session.seenSets.push(set._id)
  }
  if(req.session.likedItems){
    req.session.likedItems.push(item._id)
  }
  console.log("req", req.session.likedItems)
  if(req.user){
    req.user.likedItems.push(item._id)
    req.user.seenSets.push(set._id)
    await req.user.save()
  }
  const itemsArr = await ClothingItem.find({_id : {$in: set.items}}).exec()
  const totalVotes = itemsArr.reduce((total,curr) => {return total + curr.votes},0)
  contextObj = itemsArr.map((curr) =>{
    return { "item" : curr, "percentage" : ((curr.votes/totalVotes * 100).toFixed(2))}
  })
  res.redirect("/result")
})

app.get("/items", (req,res) =>{
  ClothingItem.find({}, (err, foundItems) =>{
      if(err){
          console.log(err)
      }
      res.render("items", {"items" : foundItems})
  })
})

app.get("/liked", async (req,res) =>{
  if(req.user){
      return res.redirect(("/user/liked"))
  }
  const itemIds = req.session.likedItems
  console.log("itemIds",itemIds)
  const items = await ClothingItem.find({_id: {$in : itemIds}}).exec()
  res.render("liked",{"items":items})
})

app.get("/popular",async(req,res) =>{
  const items = await ClothingItem.find({}).exec()
  let votes = items.map(item => {
    return item.votes
  })
  console.log("votes",votes)
  votes.sort((a,b)=>b-a)
  console.log("votes",votes)
  votes = votes.slice(0,5)
  console.log("votes",votes)
  const ids =[]
  const topFive = []
  for (const vote of votes){
    const item = await ClothingItem.findOne({votes :vote, _id: {$nin : ids}}).exec()
    ids.push(item._id)
    topFive.push(item)
  }
  res.render("popular", {"items": topFive})
})


app.listen(PORT);
