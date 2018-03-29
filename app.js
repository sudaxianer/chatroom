// 初始化app
var express = require('express')
var app = express();
var server = require('http').Server(app);
// 通过建立的http服务实例化一个socket.io模块
var io = require('socket.io')(server);

// var path = require('path');
app.use(express.static('public'))

app.get('/',function(req,res){
   res.sendFile(__dirname + '/chat.html');
})

server.listen(3000,function(){
    console.log('listening on port: 3000');
});

const users = []; //存储所有用户
var usersNum = 0; //存储在线人数
const _sockets = []; //存储私聊用户

// socket.io
// 建立连接
io.on('connection', function(socket) {
    usersNum ++;
    var tempUser = null;
    console.log(usersNum + "位用户已经连接");
    // 监听login
    socket.on('login', function(data){
        socket.username = data.username;
        // 判断用户名是否已经存在,空数组跳过
        users.forEach(function(user){
            if(user.username === socket.username){
                socket.emit('usernameErr', {err: '用户名已存在'});
                socket.username = null;
            }
        });
        // 用户名不重复则保存
        if (socket.username !== null) {
            var imgUrl = (Math.random()*8)|0;
            users.push({
                username: data.username,
                message: [],
                DataUrl: [],
                loginTime: new Date().getTime(),
                imgUrl,
                id: socket.id
            })
            // 为了监听私聊
            _sockets[data.username] = socket;
            console.log(users);
            // 将用户存入用户组并生成私人头像
            data.userGroups = users;
            data.imgUrl = imgUrl;
            // 发送客户端新的数据，广播
            socket.emit('loginSuccess',data);
            socket.broadcast.emit('loginSuccess',data);
        }
    });
    // 监听发送消息
    socket.on('sendMessage',function(data){
        console.log(data);
        users.forEach(function(user){
            if(user.username === socket.username) {
                user.message.push(data.message);
                data.imgUrl = user.imgUrl;
            }
        });
        // 收到消息
        socket.broadcast.emit('receiveMessage',data);
        socket.emit('receiveMessage',data);
    });
    //监听发送图片
    socket.on('sendImg',function(data) {
        console.log(data.DataUrl);
        users.forEach(function(user){
            if(user.username === data.username) {
                user.DataUrl.push(data.DataUrl);
                data.imgUrl = user.imgUrl;
            }
        });
        io.emit('receiveImg',data);
    });
    //监听私聊信息
    socket.on("sendToOne",function (data) {
        var _index = null;
        if(users.some(function (item,index) {
            if(item.username === data.username){
                _index = index;
            }
            return (item.username === data.username);
            })) {  //如果存在该用户，就触发收到私聊事件
                    _sockets[data.to].emit('SendToOneSuccess',data);
                    socket.emit("receiveSendToOne",data);
                }
    });
    //断开连接时
    socket.on('disconnect',function(){
        usersNum--;
        //如果存在用户名，触发someOneLeave
        if(tempUser !== 'undefined') {
            socket.broadcast.emit('someOneLeave',{username: socket.username});
        }
        var tmpIndex = null;
        // 删除用户组中下线的用户
        users.forEach(function(item,index,array) {
            if(item.username === socket.username){
                tmpIndex = index;
                console.log("删除用户：" + users[tmpIndex].username);
                users.splice(tmpIndex,1);
            }
        });
    })
});
