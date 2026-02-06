
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path=require("path");
const ejsMate=require("ejs-mate");
const methodoverride=require("method-override");
const ExpressError= require("./utils/ExpressError.js");
const listingsRouter =require("./routes/listing.js");
const reviewsRouter =require("./routes/review.js");
const userRouter =require("./routes/user.js");
const  session = require("express-session");
const MongoStoreLib = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user.js");
const MONGO_URL = "mongodb://127.0.0.1:27017/mydatabase";
const dbUrl = process.env.ATLASDB_URL || MONGO_URL;

main().then(() => {
  console.log("connected to db");
}).catch((err) => {
  console.error('DB connection error:', err);
});

async function main() {
  await mongoose.connect(dbUrl);
}


app.set("view engine", 'ejs');
app.set("views", path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodoverride('_method'));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));


// Create session store in a way that works with both CJS and ESM exports
const createStore = MongoStoreLib && (MongoStoreLib.create || (MongoStoreLib.default && MongoStoreLib.default.create));
if (!createStore) {
  console.warn('connect-mongo create() not found. Check connect-mongo version.');
}
const store = createStore ? createStore({
  mongoUrl: dbUrl,
  crypto: { secret: process.env.SECRET },
  touchAfter: 24 * 3600,
}) : null;

if (store) {
  store.on('error', err => {
    console.error('error in mongo session store', err);
  });
} else {
  console.warn('Session store not created; sessions will still work in memory (not recommended for production).');
}

const sessionOptions ={
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized: true,
    cookie:{
        expires:Date.now() +7*24*60*1000,
        maxAge: 7*24*60*1000,
        httpOnly:true,
    },
};


// app.get("/", (req, res) => {
//    res.redirect("/listings");   
// });

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
// passport.use(new LocalStrategy)
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req,res,next)=>{
     res.locals.currUser = req.user;
    res.locals.success=req.flash("success");
     res.locals.error=req.flash("error");
    //  res.locals.currUser = req.user;
    next();
});
// app.use((req, res, next) => {
//   res.locals.currUser = req.user;
//   next();
// });


// app.get("/demouser",async(req,res)=>{
//     let fakeUser = new User({
//         email:"student@gmail.com",
//         username:"web-developer"
//     });
//     let registeredUser = await User.register(fakeUser,"hello");
//     res.send(registeredUser);
// })

app.get("/", (req, res) => {
   res.redirect("/listings");   
});


app.use("/listings",listingsRouter)
// app.get('/listings/search', async (req, res) => {
//   const searchQuery = req.query.q;  // Use 'q' param for search
  
//   if (!searchQuery) {
//     return res.redirect('/listings');  // Redirect if no query
//   }
  
//   const searchResults = await Listing.find({
//     title: { $regex: searchQuery, $options: 'i' }  // Case-insensitive partial match
//   });
  
//   res.render('listings/index', { allListings: searchResults, searchQuery });
// });
app.use("/listings/:id/reviews",reviewsRouter)
app.use("/",userRouter);

// Favicon handler — prevents noisy 404s from browsers requesting /favicon.ico
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Privacy route
app.get('/privacy', (req, res) => {
  res.render("privacy");
});
app.get('/terms', (req, res) => {
  res.render("terms");
});

// Terms route
// app.get('/terms', (req, res) => {
//   res.send(`
//     <h1>Terms & Conditions</h1>
//     <p>By using this website, you agree to follow our rules and provide correct information.</p>
//     <p>Rentals, prices, and availability may change; bookings are confirmed only after successful payment.</p>
//     <p>You are responsible for the rented item during your rental period and must pay for any loss or damage.</p>
//     <p>We may update these terms and the privacy policy; continued use means you accept the changes.</p>
//   `);
// });

app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});
app.use((err,req,res,next)=>{
  // Suppress full stack logs for 404s (keep concise info) to reduce noise
  let {statusCode=500,message="something went wrong!"}=err;
  // Treat explicit 404s and standard 'Page Not Found' errors as 404 (quiet info only)
  if (statusCode === 404 || (err && err.message && /page not found/i.test(err.message))) {
    console.info(`404 Not Found: ${req.method} ${req.originalUrl}`);
    return res.status(404).render("error.ejs" ,{message: message || 'Page Not Found!'});
  }

  // Log full details for non-404 errors
  console.error('GLOBAL ERROR HANDLER:', err && err.stack ? err.stack : err);

  // Multer / upload-specific friendly messages
  if (err && (err.message === 'Only image files are allowed' || err.code === 'LIMIT_FILE_SIZE')) {
    req.flash('error', err.message || 'File too large');
    return res.redirect('back');
  }

  res.status(statusCode).render("error.ejs" ,{message});
});
// app.listen(8080, () => {
//     console.log("server is listening on port 8080");
// });

const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`server is listening on port ${port}`);
});
