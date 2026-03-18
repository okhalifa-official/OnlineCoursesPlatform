require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const connection = require("./database");
courseRouter = require('./Routers/course');
educationalContentRouter = require('./Routers/educationalContent');
userRouter = require('./Routers/user');
const port = 4000;
connection();
app.use(cors());

app.use(express.json());
app.use('/user', userRouter);
app.use('/educationalContent', educationalContentRouter);
app.use('/courses', courseRouter);
app.get('/', (req, res) => {
  res.send('Server now runing side runing....');
});



app.listen(port, () => {
  console.log('Connecting to server......');
  console.log(`Server now listening on port ${port}`);
  console.log(`Now you can run localhost:${port} and see a message`);
});
