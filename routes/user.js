  const express=require("express");
   const router=express.Router();
   const User= require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const passport= require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const userController =require("../controllers/user.js");

   router.get("/signup", userController.renderSignupForm);
  //   (req,res)=>{
  //   res.render("users/signup.ejs")
  //  })

  router.post("/signup", wrapAsync(userController.signup)
);
  //   async(req,res)=>{
  //   try{

  //        let{username,email,password}=req.body;
  //   const newUser=new User ({email,username});
  //  const registeredUser=  await User.register(newUser,password);
  //  console.log(registeredUser);
  //  req.login(registeredUser,(err)=>{
  //   if(err){
  //     return next(err);
  //   }
  //   req.flash("success","Welcome to ToolBnB !");
  //  res.redirect("/listings");
  //  });
   
  //   }catch(e){
  //       req.flash("error",e.message);
  //       res.redirect("/signup");
  //   }
  // } ));

  router.get("/login",userController.renderLoginForm);
  //   (req,res)=>{
  //   res.render("users/login.ejs");
  // });
  router.post("/login",saveRedirectUrl,passport.authenticate("local",{ failureRedirect:"/login",failureFlash:true}),
  userController.login);
  // (req,res)=>{
  //  req.flash("success","welcome back  to ToolBnB! ");
  //  const  redirectUrl=req.session.redirectUrl||"/listings";
  //  delete req.session.redirectUrl;
  //  res.redirect(redirectUrl);
  // });

  router.get("/logout",userController.logout);
  //   (req,res)=>{
  //   req.logout((err)=>{
  //     if(err){
  //       next(err);
  //     }
  //     req.flash("success","you are logged out!");
  //     res.redirect("/listings");
  //   })
  // })
   module.exports=router;




  //  '69511498e6622a40e1825753'