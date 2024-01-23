const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//Register New User
const register = async (req, res) => {
  const { username, password, confirmPassword } = req.body;
  const lowercasedUsername = username.toLowerCase();

  //check if user not input username and password
  if (!username && !password) return res.status(400).json({ msg: "input username and password.." });

  //check if user not input username
  if (!username) return res.status(400).json({ msg: "input username.." });

  //check if user not input password
  if (!password) return res.status(400).json({ msg: "input password.." });

  //check if password and confirm password not match
  if (password !== confirmPassword)
  return res
  .status(400)
  .json({ msg: "password and confirm password unmatch" });

  //check username already exist
  const existingUser = await prisma.users.findUnique({
    where: { username: lowercasedUsername },
  });
  if (existingUser) {
    return res.status(400).json({ msg: "Username already exists" });
  }

  // Check if username length exceeds 9 characters
  if (lowercasedUsername.length > 9) {
    return res
      .status(400)
      .json({ msg: "Username must be at most 9 characters" });
  }

  const salt = await bcrypt.genSalt();
  const hashPassword = await bcrypt.hash(password, salt);

  try {
    await prisma.users.create({
      data: { username, password: hashPassword },
    });
    res.json({ msg: "register berhasil" });
  } catch (error) {
    console.log(error);
  }
};

//Login User
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const lowercasedUsername = username.toLowerCase();

    //check if user not input username and password
    if (!username)
      return res.status(401).json({ msg: "input username and password" });

    //check if user not input username
    if (!username) return res.status(401).json({ msg: "input username.." });

    //check if user not input password
    if (!password) return res.status(401).json({ msg: "input password.." });

    // Check if the user exists
    const user = await prisma.users.findUnique({
      where: { username: lowercasedUsername },
    });
    if (!user) {
      return res.status(401).json({ msg: "Invalid username" });
    }

    // Compare the provided password with the hashed password in the database
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ msg: "Invalid password" });
    }

    // Successful login
    if (passwordMatch) {
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
        },
        process.env.JWT_KEY,
        {
          expiresIn: "1h",
        }
      );


      return res.json({ msg: "Login successfully", token: token });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

module.exports = { register, login };
