const mongoose = require('mongoose'),
passportLocalMongoose = require('passport-local-mongoose');


const ClothingItem = new mongoose.Schema({
	name: {type: String, required: true},
	category : {type: String, required: true},
	storeLink : {type: String, required: true},
	imgUrl : {type: String, required: true},
	votes : Number,
	inSet : {type:Boolean, default: false, required:true},
	set : {type:mongoose.Schema.Types.ObjectId},
})
const Set = new mongoose.Schema({
	items : [mongoose.Schema.Types.ObjectId], //four clothingItems
});

const User = new mongoose.Schema({
	username : {type:String,required: true},
	likedItems: [mongoose.Schema.Types.ObjectId],
	seenSets: [mongoose.Schema.Types.ObjectId],
  });

User.plugin(passportLocalMongoose); //gives authenticate method on user object

mongoose.model('User', User);
mongoose.model('ClothingItem', ClothingItem);
mongoose.model('Set',Set)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/ilikelikedb');//connects to mongo db atlas
