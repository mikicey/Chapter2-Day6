const{checkLogin,alreadyLogin} = require("./middleware/authentication");

const express = require("express");
const app = express();
const PORT = process.env.PORT || 80

const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash")
const db = require("./connection/db");

const {getDuration} = require("./helpers/index");
const {getDateStringFormat} = require("./helpers/index")


// Url encoded middleware
app.use(express.urlencoded({extended:false}));

// Static middleware
app.use(express.static("static"));

// Engine
app.set("view engine", "hbs");

// Express session
app.use(session({
    secret: "k320irh028ih2",
    resave:false,
    saveUninitialized:true,
    cookie: {
        maxAge: 2 * 60 * 60 * 1000 // 2 JAM
    }
}))

app.use((req,res,next)=>{
    console.log(req.session);
    next();
})


// Connect
db.connect(function(err,client,done){



// REGISTER
app.get("/register", alreadyLogin, (req,res)=>{
    res.render("register",{isLogin:req.body.isLogin})
})

app.post("/register",(req,res)=>{
    const {email,password,username} = req.body;

    const hashedPassword = bcrypt.hashSync(password,10);
    
    client.query(`INSERT INTO public.users("username", "email", "password")
    VALUES ($1, $2, $3)`, [username, email, hashedPassword] , (err,result)=>{
        if(err) throw err;
        res.redirect("/login");; })
})

// LOGIN 
app.get("/login", alreadyLogin,(req,res)=>{
    res.render("login",{isLogin:req.body.isLogin});
})

app.post("/login", (req,res)=>{
     const {email,password} = req.body;

     client.query(`SELECT * FROM public.users WHERE email=$1`,[email], (err,result)=>{
        let user = result.rows[0];
 
        if(result.rows.length == 0){
            return res.redirect("/login")
        }

        const isMatch = bcrypt.compareSync(password,user.password);

        if(!isMatch) {
              req.flash("danger","Password salah")
        } else {
            req.session.isLogin = true;
            req.session.user = {
                id : result.rows[0].id,
                username: result.rows[0].username,
                email:result.rows[0].email
            }
            res.redirect("/")
        }

     


        
    });
    
})

// LOGOUT 
app.get("/logout",(req,res)=>{
    req.session.destroy();
    res.redirect("/");
})




                        //    ROUTES
// GET ALL
app.get("/" , (req,res)=> {
    if(err) throw err;
   
    
    client.query("SELECT * FROM public.projects", (err,result)=>{
        if(err) throw err;

        let data = result.rows;
        const isPostNotThere = data.length == 0 ? true : false;
        res.render("home",{data:data,isPostNotThere,isLogin:req.body.isLogin})
        
    })

})


// GET SINGLE
app.get("/single/:id",(req,res)=>{
    if(err) throw err;

    const id = req.params.id;

    client.query(`SELECT * FROM public.projects WHERE id=${id}`, (err,result)=>{
        let data = result.rows[0];
        res.render("single",{data:data,isLogin:req.body.isLogin})
        
    });

});


app.get("/addmyproject",checkLogin,(req,res)=>{
    res.render("addproject",{isLogin:req.body.isLogin})    
});

app.get("/contact",(req,res)=>{
    res.render("contact",{isLogin:req.body.isLogin})
});

// POST
app.post("/postmyproject",checkLogin,(req,res)=>{

    if(err) throw err;
    const newData = req.body;

    const duration = getDuration(req.body.startDate,req.body.endDate);
    const stringDate = getDateStringFormat(req.body.startDate) + '-' + getDateStringFormat(req.body.endDate);

    const isNode = req.body.node ? true : false;
    const isReact = req.body.react ? true : false;
    const isJS = req.body.js ? true : false;
    const isCSS = req.body.css ? true : false;

    const imageUrl = '/images/pexels-pixabay-220453.jpg';


   
    client.query(`INSERT INTO public.projects("title", "startDate", "endDate", "stringDate", duration, description, img, "isNode", "isReact", "isJS", "isCSS")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [newData.title, newData.startDate, newData.endDate, stringDate, duration, newData.description, imageUrl, isNode,isReact,isJS,isCSS] , (err,result)=>{
            if(err) throw err;
            res.redirect("/"); })
});

// DELETE
app.get("/deletemyproject/:id",checkLogin,(req,res)=>{

    
    const id = req.params.id;
    
    client.query(`DELETE FROM public.projects
	WHERE id=${id}`, (err,result)=>{
        if(err) throw err;
        res.redirect("/");
    })

})

// EDIT
     // get edit form page
app.get("/editproject/:id", checkLogin , (req,res)=>{
       if(err) throw err;
       const id = req.params.id;

       client.query(`SELECT * FROM public.projects WHERE id=${id}`, (err,result)=>{
        if(err) throw err;

        let data = result.rows[0];
        res.render("editproject",{dataToEdit:data,isLogin:req.body.isLogin})
    });
       

});
    // submit form from edit page
app.post("/editmyproject/:id", checkLogin,(req,res)=>{
    if(err) throw err;

    const id = req.params.id
    const updatedData = req.body;


    const duration = getDuration(req.body.startDate,req.body.endDate);
    const stringDate = getDateStringFormat(req.body.startDate) + '-' + getDateStringFormat(req.body.endDate);


    const isNode = req.body.node ? true : false;
    const isReact = req.body.react ? true : false;
    const isJS = req.body.js ? true : false;
    const isCSS = req.body.css ? true : false;

    const imageUrl = '/images/pexels-pixabay-220453.jpg';


    client.query(`UPDATE public.projects
	SET title=$1, "startDate"=$2, "endDate"=$3, "stringDate"=$4, duration=$5, description=$6, img=$7, "isNode"=$8, "isReact"=$9, "isJS"=$10, "isCSS"=$11
	WHERE id=$12`,[updatedData.title, updatedData.startDate, updatedData.endDate, stringDate, duration, updatedData.description, imageUrl, isNode,isReact,isJS,isCSS,id], (err,result)=>{
      if(err) throw err;
      res.redirect("/");
    });

})


});



app.listen(PORT, ()=>{
    console.log(`Connected to ${PORT}`)
})


