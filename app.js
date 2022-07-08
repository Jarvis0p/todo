const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(express.static("public"));


// mongoose connection
mongoose.connect("mongodb+srv://jarvis0p:jarvis0p@cluster0.kzpyaio.mongodb.net/todolistDB", {
	useNewUrlParser: true
});
// Schema
const itemSchema = {
	name: String
};

// model
const Item = mongoose.model("Item", itemSchema)

const item1 = new Item({
	name: "Welcome to your todolist!"
});
const item2 = new Item({
	name: "Hit the + button to add a new item."
});
const item3 = new Item({
	name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
	name: String,
	items: [itemSchema]
};

const List = mongoose.model("List", listSchema)


// main page
app.get("/", function (req, res) {
	Item.find({}, function (err, foundItems) {
		if (foundItems.length === 0) {
			Item.insertMany(defaultItems, function (err) {
				if (err) {
					console.log(err);
				} else {
					console.log("Successfully saved");
				}
			});
			res.redirect("/")
		} else {
			res.render("list", {
				listTitle: "Today",
				newListItems: foundItems
			});
		}
	});
});

app.post("/", function (req, res) {
	const itemName = req.body.newItem;
	const listName = req.body.list;

	const item = new Item({
		name: itemName
	});
	if (listName === "Today") {
		item.save();
		res.redirect("/");
	} else {
		List.findOne({
			name: listName
		}, function (err, foundList) {
			foundList.items.push(item);
			foundList.save();
			res.redirect("/" + listName);
		});
	}
});

// delete item
app.post("/delete", function (req, res) {
	const checkedItemID = req.body.checkbox;
	const listName = req.body.listName;

	if (listName === "Today") {
		Item.findByIdAndRemove(checkedItemID, function (err) {
			if (err) {
				console.log(err);
			} else {
				console.log("Successfully Deleted");
				res.redirect("/")
			}
		});
	} else {
		List.findOneAndUpdate({
			name: listName
		}, 
		{$pull:{items: {_id: checkedItemID}}}, 
		function (err, foundList) {
			if(!err){
				res.redirect("/" + listName);
			}
		});
	}
});


// main page end

//  Custom List page
app.get("/:customListName", function (req, res) {
	const customListName = _.capitalize(req.params.customListName);
	// 


	List.findOne({
		name: customListName
	}, function (err, foundList) {
		if (!err) {
			if (!foundList) {
				// Create new List
				const list = new List({
					name: customListName,
					items: defaultItems
				});
				list.save();
				res.redirect("/" + customListName);
			} else {
				// Show an existing list
				res.render("list", {
					listTitle: foundList.name,
					newListItems: foundList.items
				});
			}
		}
	});
});

// work page end





// about page
app.get("/about", function (req, res) {
	res.render("about");
});
// end of about page
app.listen(process.env.PORT || 3000, function () {
	console.log("Server started on port 3000");
});