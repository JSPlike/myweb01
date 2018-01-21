// Express 기본모듈
var express = require('express'),
    http = require('http'),
    path = require('path');

// Express 미들웨어
var static = require('serve-static'),
    bodyParser = require('body-parser');

// mongo 관련 모듈
var mongoose = require('mongoose');

// 데이터베이스 객체
var database;

// 데이터베이스 스키마 객체
var UserSchema;

// 데이터베이스 모델 객체
var UserModel;

// Express 객체생성
var app = express();

//app.set('views', path.join(__dirname, 'views'))
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'jade');

// Express Router 객체참조 
var router = express.Router();

app.use(bodyParser.urlencoded({extended : false}));
app.use(bodyParser.json());
app.use(static(path.join(__dirname, 'public')));

// 데이터베이스에 연결 부분
function connectDB() {
    var databaseUrl = 'mongodb://localhost:27017/local';
    
    // 데이터베이스 연결
    console.log('데이터베이스 연결 시도');
    mongoose.Promise = global.Promise;
    mongoose.connect(databaseUrl);
    database = mongoose.connection;
    
    database.on('error', console.error.bind(console, 'mongoose connection err'));
    database.on('open', function(){
        console.log('데이터베이스 연결 완료 : ' + databaseUrl);
        
        // 스키마 정의
        UserSchema = mongoose.Schema({
            id: {type: String, required: true, unique: true},
            hashed_password: {type: String, required: true},
            name: {type: String, index: 'hashed'},
            age: {type: Number, 'default': -1}
            created_at: {type: Date, index: {unique: false}, 'default': Date.now},
            updated_at: {type: Date, index: {unique: false}, 'default': Date.now}
        });
        console.log('UserSchema 정의 완료');
        
        // UserModel 정의
        UserModel = mongoose.model("users", UserSchema);
        console.log('UserModel 정의');
    });
    // 연결 해제시 재 연결
    database.on('disconnected', function(){
        console.log('연결이 끊겼습니다.. 재 연결을 시도합니다.');
        setInterval(connectDB, 3000);
    });
}

// 유저 인증 코드
var authUser = function(database, id, password, callback){
    console.log('사용자 인증시도 : ' + id + ', ' + password);
    
    // 아이디와 비밀번호 검색
    UserModel.find({"id" : id, "password" : password}, function(err, results){
        if(err){
            callback(err, null);
            return;
        }
        console.log('아이디 [%s], 비밀번호 [%s]로 사용자 검색 결과', id, password);
        console.dir(results);
        if(results.length > 0){
            console.log('일치하는 사용자가 있습니다.');
            callback(null, results);
        }
        else {
            console.log('일치하는 사용자가 없습니다.');
            callback(null, null);
        }
    });
};

// 사용자 등록 함수
var addUser = function(database, id, password, name, age, callback){
    console.log('authUser 호출 : ' + id + ', ' + password);
    
    // UserModel의 인스턴스 생성
    var user = new UserModel({"id" : id, "password" : password, "name": name});
    
    // save()
    user.save(function(err){
        if(err) {
            callback(err, null);
            return;
        }
        console.log('1명의 사용자 데이터 추가');
        callback(null, user);
    });
}

//=== 유저 검색 ===//

// 스키마에 static 메소드 추가
UserSchema.static('findById', function(id, callback){
    return this.find({id: id}, callback);
});

UserSchema.static('findAll', function(callback){
    return this.find({ }, callback);
});

console.log('UserSchema 정의');

// UserModel 모델
UserModel = mongoose.model("users2", UserSchema);
console.log('UserModel 정의');

router.route('/process/users/:id').get(function(req, res){
    console.log('process/users/:id 처리함');
    
    var paramId = req.params.id;
    
    console.log('process/user와 토큰 %s를 이용해 처리', paramId);
    
    res.write('<div><p>Param id : ' + paramId + '</p></div>');
    res.end();
});
app.use('/', router);

http.createServer(app).listen(app.get('port'), function(){
    console.log('서버시작 : ' + app.get('port'));
});