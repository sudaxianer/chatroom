$(function(){
    var inputName = $('#name');
    var loginBtn = $('#loginbtn');
    var sendBtn = $('#sendbtn');
    var chatInput = $('#chatinput');
    var inputGroup = $('#inputgroup')
    var userList = $("#userGroup .list-group"); 
    var imgBtn = $('#imgbtn');
    var imgInput = $('#imginput');
    
    var socket = io.connect();

    var _username = null; //用户名
    var allUsers = [];
    var _to = null;

    // 初始化样式
    var initHeight = function () {
        //chattitle:显示的聊天界面
        var _maxHeight = inputGroup.offset().top - $('#chattitle').offset().top - $('#chattitle').height() - 50;
        //设置聊天界面内容能占据的最大高度
        $('#content').css('max-height',_maxHeight);
        var _maxHeight1 = $(window).height() - 150;
        //在线成员容器能占据的最大高度
        $(".list-group").css("max-height",_maxHeight1);
    };

    // 随机头像iconfont
    var randomAvatar = function (imgUrl) {
        if(typeof imgUrl === 'undefined'){
            imgUrl = (Math.floor(Math.random()*11))|0;
        }
        switch (imgUrl) {
            case 0 :
                return "#icon-laoyeye";
            case 1 :
                return "#icon-nvzhi";
            case 2 :
                return "#icon-jingcha";
            case 3 :
                return "#icon-zuifan";
            case 4 :
                return "#icon-gongren";
            case 5 :
                return "#icon-xuesheng";
            case 6 :
                return "#icon-yisheng";
            case 7 :
                return "#icon-shibing";
            case 8 :
                return "#icon-fuwuyuan";
            case 9 :
                return "#icon-laonainai";
            case 10 :
                return "#icon-kuaidi";
            case -1 :
                return "#icon-yundong"
        }
    };

    // 存储用户名并发送服务端
    var setUsername = function() {
        _username = inputName.val().trim();
        if (_username) {
            socket.emit('login', {username: _username});
        }
    }

    // 监听登录成功
    socket.on('loginSuccess',function (data){
        if(_username === data.username) {
            //将自己添加到用户数组里
            var user = {username: _username, imgUrl: -1};
            allUsers.push(user);
            //启动聊天界面
            beginChat(data);
        } else {
            showComLeave(1,data);
            var user = {username: data.username, imgUrl: data.imgUrl};
            allUsers.push(user);
            //添加到列表中
            addDeleteUsersLise(1,data);
            initHeight();
        }
    });

    // 监听用户名是否重复
    socket.on('usernameErr',function (data){
        //提醒用户用户名重复
        $('.form-signin').addClass('has-error');
        $('<label class="control-label" for="inputError1">用户名重复</label>').insertAfter($('#name'));
        setTimeout(function () {
            $('.form-signin').removeClass('has-error');
            $('#name + label').remove();
        },1500)
    });

    // 启动聊天界面
    var beginChat = function(data) {
        $('#loginbox').hide('slow');
        // 移除绑定事件
        inputName.off('keyup');
        loginBtn.off('click');
        // 显示聊天界面
        $(`<h2 id="chattitle">${data.username}的聊天室</h2>`).insertBefore($("#content"));
        $(`<strong>欢迎你</strong><span>${_username}!</span>`).insertAfter($('#myalert button'));
        $("#myalert1").hide();
        $("#myalert2").hide();
        $('#myalert').alert();
        setTimeout(function () {
            $('#myalert').alert('close');
        },2000);
        $('#chatbox').show('slow');
        initHeight();
        //在用户组里设置自己的信息，初始化用户列表
        userList.append($(`
            <li class="list-group disabled" name="${_username}">
                <svg class="icon" aria-hidden="true" style="font-size: 2em;">
                    <use xlink:href="#icon-yundong"></use>
                </svg>
                ${_username}
            </li>
        `));
        for (var user of data.userGroups) {  //遍历用户组，如果不是自己就写到在线成员中
            if(user.username !== _username) { 
                userList.append($(`
                    <li class="list-group" name="${user.username}" data-toggle="modal" data-target="#myModal">
                        <svg class="icon" aria-hidden="true" style="font-size: 2em;">
                            <use xlink:href="${randomAvatar(user.imgUrl)}"></use>
                        </svg>
                        ${user.username}
                    </li>
                `));
            }
        }
    };

    // 发送消息
    var sendMessage = function() {
        var _message = chatInput.val().trim();
        if (_message) {
            socket.emit('sendMessage',{message: _message, username: _username});
            console.log(_message);
        }
    };

    // 监听收到消息
    socket.on('receiveMessage',function (data) {
        var _message = data.message;
        showMessage(_message,data.username,data.imgUrl);
    });

    // 展示消息
    var showMessage = function(message,username,imgUrl) {
        if(username === _username) {
            $('#content').append(`
                <div class="receiver">
                    <div>
                        <svg class="icon img-circle" aria-hidden="true" style="font-size: 2em;">
                            <use xlink:href="#icon-yundong"></use>
                        </svg>
                        <strong style="font-size: 1.5em;">
                            ${username}&nbsp;
                        </strong>
                    </div>
                    <div>
                        <div class="right_triangle"></div>
                        <span>&nbsp;&nbsp;${message}</span>
                    </div>
                </div>
            `);
        } else {
            $('#content').append(`
                <div class="sender">
                    <div>
                        <svg class="icon img-circle" aria-hidden="true" style="font-size: 2em;">
                            <use xlink:href="#${randomAvatar(imgUrl)}"></use>
                        </svg>
                        <strong style="font-size: 1.5em;">${username}&nbsp;</strong>
                    </div>
                    <div>
                        <div class="left_triangle"></div>
                        <span>&nbsp;${message}</span>
                    </div>          
                </div>
            `);
        }
        initHeight();
    };

    // 绑定登录事件
    inputName.on('keyup', function(event) {
        if (event.keyCode === 13) {
            setUsername();
            return false;
        }
    });
    loginBtn.on('click', function(event) {
        setUsername();
        return false;
    });

    // 发送图片
    var sendImg = function(event) {
        //检测浏览器是否支持FileRead
        if(typeof FileReader === 'undefined'){
            alert('您的浏览器不支持!');
            //禁用Button
            imgButton.attr('disabled','disabled');
        }
        var file = event.target.files[0];
        //重置一下form元素，否则如果发同一张图片不会触发change事件
        $("#resetform")[0].reset();
        if(!/image\/\w+/.test(file.type)) {
            alert('只能选择图片');
            return false;
        }
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(e){
            var _this = this;
            socket.emit('sendImg',{username: _username, DataUrl: _this.result});
        }
    };

    // 监听收到图片
    socket.on('receiveImg',function (data) {
        console.log("可以显示图片了");
        var DataUrl = data.DataUrl;
        showImg(DataUrl,data.username,data.imgUrl);
    });

    // 展示图片
    var showImg = function(DataUrl,username,imgUrl) {
        if(username === _username) {
            $('#content').append(`<div class="receiver">
                                    <div>
                                        <svg class="icon img-circle" aria-hidden="true" style="font-size: 2em;">
                                            <use xlink:href="#icon-yundong"></use>
                                        </svg>
                                        <strong style="font-size: 1.5em;">
                                            ${username}&nbsp;
                                        </strong>
                                    </div>
                                    <div>
                                        <div class="right_triangle"></div>
                                        <span><img class="img-thumbnail" src="${DataUrl}" style="max-height: 100px"/></span>
                                    </div>
                                </div>`);
        } else {
            $('#content').append(`<div class="sender">
                                    <div>
                                        <svg class="icon img-circle" aria-hidden="true" style="font-size: 2em;">
                                            <use xlink:href="#${randomAvatar(imgUrl)}"></use>
                                        </svg>
                                        <strong style="font-size: 1.5em;">${username}&nbsp;</strong>
                                    </div>
                                    <div>
                                        <div class="left_triangle"></div>
                                        <span><img class="img-thumbnail" src="${DataUrl}" style="max-height: 100px"/></span>
                                    </div>
                                    
                                </div>`);
        }
        initHeight();
    };

    // 绑定图片事件
    imgBtn.on('click',function (event) {
        imgInput.click();
        return false;
    });
    imgInput.change(function(event) {
        sendImg(event);
    });

    // 绑定消息事件
    chatInput.on('keydown',function (event) {
        if(event.keyCode === 13) {
            sendMessage();
            chatInput.val('');
        }
    });
    sendBtn.on('click',function (event) {
            sendMessage();
            chatInput.val('');
            return false;
    });

    // 显示登录离开信息
    var showComLeave = function (flag,data) {  //flag为1表示登录为-1表示离开
        if(flag === 1) {
            //有好友登录了
            console.log("有好友登录:" + data.username);
            $('#myalert1 span').html(`<span>您的好友<strong>${data.username}</strong>上线了!</span>`);
            setTimeout(function(){
                $("#myalert1").hide();
            },2000);
            $("#myalert1").show();
        }
        else if(flag === -1) {
            if(typeof data.username === 'undefined'){
                return;
            }
            //有好友离开了
            $('#myalert2 span').html(`<span>您的好友<strong>${data.username}</strong>下线了!</span>`);
            console.log(data.username);
            setTimeout(function(){
                $("#myalert2").hide();
            },2000);
            $("#myalert2").show();
        }
    };

    // 添加删除用户列表
    var addDeleteUsersLise = function (flag,data) {  //flag为1表示添加用户，为-1表示删除用户
        if (flag === 1) {
            userList.append(
                $(`
                    <li class="list-group disabled" name="${_username}"  data-toggle="modal" data-target="#myModal">
                        <svg class="icon" aria-hidden="true" style="font-size: 2em;">
                            <use xlink:href="#${randomAvatar(data.imgUrl)}"></use>
                        </svg>
                        ${data.username}
                    </li>
                `));
        }
        if (flag === -1) {
            //先从列表中删除那个人
            allUsers.forEach(function (user,index) {
                if(user.username === data.username) {
                    allUsers.splice(index,1);
                }
            });
            //然后删除列表中的那一项
            userList.find(`li[name='${data.username}']`).remove();
        }
    };

    // 初始私聊化模态框
    var initModal = function (event) {
        var _$button = $(event.target); //得到按钮
        _to = _$button.attr('name');
        $("#myModalLabel").text(`发给${_to}`);
    };

    //监听模态框
    userList.on('click',function(event){
        //显示模态框
        initModal(event);
    });

    //发送私聊信息
    $("#sendtoo").on('click',function (event) {
        //得到input框中的文字，触发私聊事件
        var _msg = $("#inputtoone").val();
        if(_msg === ''){
            return false;
        }
        socket.emit('sendToOne',{message: _msg, username: _username, to: _to});
        _to = null;
    });

    // 监听私聊发送成功
    socket.on('SendToOneSuccess',function (data){
        $("#myModalLabel1").text(`${data.username}给你的留言`);
        $(".shoudao").text(data.message);
        $("#showmodal").click();
    });

    // 监听私聊收到信息
    socket.on("receiveSendToOne",function (data){
        $("#inputtoone").val('');
        $("#closesendtoo").click();
    })

    // 监听用户离线
    socket.on('someOneLeave',function (data){
        //显示信息
        showComLeave(-1,data);
        //删除用户列表中的该用户
        addDeleteUsersLise(-1,data);
    });
});