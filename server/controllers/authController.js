const User = require("../models/userModel");
const { createSecretToken } = require("../util/secretToken");
const bcrypt = require("bcrypt");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { youtubePlaylistItemIDs: youtubePlaylistData } = require("./youtubeController");

module.exports.Signup = async (req, res, next) => {
  try {
    const { email, password, username, createdAt } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ message: "User already exists" });
    }
    const user = await User.create({ email, password, username, createdAt });
    const token = createSecretToken(user._id);
    res.cookie("token", token, {
      withCredentials: true,
      httpOnly: false,
    });
    res
      .status(201)
      .json({ message: "User signed in successfully", success: true, user });
    next();
  } catch (error) {
    console.error(error);
  }
};

module.exports.Login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if(!email || !password ){
      return res.json({message:'All fields are required'})
    }
    const user = await User.findOne({ email });
    if(!user){
      return res.json({message:'Incorrect email' }) 
    }
    const auth = await bcrypt.compare(password,user.password)
    if (!auth) {
      return res.json({message:'Incorrect password' }) 
    } 
    const token = createSecretToken(user._id);
    res.cookie("token", token, {
      withCredentials: true,
      httpOnly: false,
    });
    res.status(201).json({ message: "User logged in successfully", success: true });
    next()
  } catch (error) {
    console.error(error);
  }
}

module.exports.userVerification = (req, res) => {
  const token = req.cookies.token
  if (!token) {
    return res.json({ status: false })
  }
  jwt.verify(token, process.env.TOKEN_KEY, async (err, data) => {
    if (err) {
     return res.json({ status: false })
    } else {
      const user = await User.findById(data.id)
      if (user) return res.json({ status: true, user: user.username, userId:user._id })
      else return res.json({ status: false })
    }
  })
}

module.exports.transferPlaylist = async (req, res) => {
  try {
    console.log("Transfering Playlist Started: ...")
    const { playlistList, sourceApp, destinationApp, userId } = req.body;
    if(!playlistList) {
      return res.json({message: "No playlist selected :("})
    }
    switch (sourceApp) {
      case "Youtube":
        console.log(sourceApp, " --> ", destinationApp)
        console.log(playlistList)
        const {status, message} = await youtubePlaylistData(destinationApp, playlistList, userId)
        if (status === "success") {
          const playlistItemIDs = message
        } else {
          res.status(500).json({error: message})
        }
        break;
      case "Spotify":
        console.log(destinationApp, sourceApp)
    }
    res
      .status(201)
      .json({message: "Transfer Completed!", success: true});
  } catch(error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}