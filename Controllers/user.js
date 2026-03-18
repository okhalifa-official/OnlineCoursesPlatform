const User = require('../Models/user');

const signup = async (req, res) => {
  try {
    if (
      !req.body.name ||
      !req.body.email ||
      !req.body.password ||
      !req.body.role
    ) {
      return res.status(400).send({
        message: 'Send all required fields: name, email, password, role',
      });
    }

    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).send({ message: 'Email already in use' });
    }

    const newUser = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
    };

    const user = await User.create(newUser);

    return res.status(201).send(user);
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});

    return res.status(200).json({
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    return res.status(200).send(user);
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    if (!req.body.email || !req.body.password) {
      return res.status(400).send({
        message: 'Send all required fields: email, password',
      });
    }

    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    if (user.password !== req.body.password) {
      return res.status(401).send({ message: 'Invalid password' });
    }
    
    return res.status(200).send(user);
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

module.exports = {
  signup,
  getAllUsers,
  getUserById,
  login,
};