const {MongoClient} = require('mongodb');
const CryptoJS=require("crypto-js");
const JWT=require("jsonwebtoken");
const dotenv=require('dotenv');
const http = require('http');
const cors=require('cors')

dotenv.config()
cors()

async function getUserFromDB(username){
    const client= new MongoClient(process.env.MONGO_URL);

    try{
        await client.connect();
        const collection =client.db("test").collection("users")
        const user=await collection.findOne({username:username})
        return user
    }catch(err){
        console.log(err)
    }
}

const server = http.createServer(async (req, res) => {

  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Headers", "content-Type");
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');

  if(req.method=="OPTIONS"){
    res.statusCode=204;
    res.end()
  }else{
    
  try {

    if (req.url==="/login" && req.method === 'POST') {

      let body = "";
      req.on('data', (chunk) => {
        body+=chunk;
      }).on('end', async() => {
        const userData=JSON.parse(body)

        // get user data from DB      
        const user = await getUserFromDB(userData.email);

        // Verify user
        if (!user) {
          res.statusCode = 401;
        res.end('Usernamssse or passwrod is incorrect');
        return;
        }
        
        // Check if password is correct
        const decryptPassword= CryptoJS.AES.decrypt(user.password,process.env.PASS_CODE).toString(CryptoJS.enc.Utf8);
        
        if (decryptPassword==!userData.password) {
          res.statusCode = 401;
          res.end('Username dsfdfsor passwrod is incorrect');
          return;
        }
        
        // Generate JWT token
        const accessToken=JWT.sign({
          id:user._id,
          isadmin:user.isAdmin
        },process.env.JWT_SEC,{expiresIn:"60000"})
        
        const {password,isAdmin,createdAt,updatedAt,__v,...others}=user;
        
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({...others,accessToken}));
      
})
    } else {

      res.statusCode = 404;
      res.end('Not Found');
    }
    
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}
});

server.listen(5000, () => {
  console.log("Server Online");
});
