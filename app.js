// Express 기본모듈
var express = require('express'),
    http = require('http'),
    path = require('path');

// Express 미들웨어
var static = require('serve-static'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    errorHandler = require('errorhandler');

// 에러 핸들러 모듈 사용
var expressErrorHandler = require('express-error-handler');

var expressSession = require('express-session');

// Passport 모듈
var passport = require('passport');
var flash = require('connect-flash');
    
// 모듈로 분리한 설정 파일 불러오기
var config = require('./config/config');

// 모듈로 분리한 데이터베이스 파일 불러오기
var database = require('./database/database');

// 모듈로 분리한 라우팅 파일 불러오기
var route_loader = require('./routes/route_loader');

// Express 객체생성
var app = express();

app.locals.appTitle = '자취 남녀';

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('port', process.env.PORT || 3000);

app.use(bodyParser.urlencoded({extended : false}));
app.use(bodyParser.json());
app.use('/public', static(path.join(__dirname, 'public')));

app.use(cookieParser());
app.use(expressSession({
    secret:'key',
	resave:true,
	saveUninitialized:true
}));


// Passport 사용 설정
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

var router = express.Router();
route_loader.init(app, router);

// 패스포트 설정
var configPassport = require('./config/passport');
configPassport(app, passport);

// 패스포트 라우팅 설정
var userPassport = require('./routes/user_passport');
userPassport(router, passport);

var LocalStrategy = require('passport-local').Strategy;

// passport login
passport.use('local-login', new LocalStrategy({
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true
}, function(req, email, password, done){
    console.log('local-login 호출 : ' + email + ', ' + password);
    
    var database = app.get('database');
    
    database.UserModel.findOne({'email' : email}, function(err, user){
        if(err){return done(err);}
        
        if(!user) {
            console.log('일치하는 계정이 없습니다');
            return done(null, false, req.flash('loginMessage', '등록된 계정이 없습니다.'));
        }
        var authenticated = user.authenticate(password, user._doc.salt,
                                             user._doc.hashed_password);
        if(!authenticated){
            console.log('비밀번호 일치 x');
            return done(null, false, req.flash('loginMessage', '비밀번호가 일치하지 않습니다.'));
        }
        
        // correct
        console.log('일치');
        return done(null, user);
    });
}));

// 패스포트 회원가입 설정
passport.use('local-signup', new LocalStrategy({
		usernameField : 'email',
		passwordField : 'password',
		passReqToCallback : true    // 이 옵션을 설정하면 아래 콜백 함수의 첫번째 파라미터로 req 객체 전달됨
	}, function(req, email, password, done) {
        // 요청 파라미터 중 name 파라미터 확인
        var paramName = req.body.name || req.query.name;
	 
		console.log('passport의 local-signup 호출됨 : ' + email + ', ' + password + ', ' + paramName);
		
	    // findOne 메소드가 blocking되지 않도록 하고 싶은 경우, async 방식으로 변경
	    process.nextTick(function() {
	    	var database = app.get('database');
		    database.UserModel.findOne({ 'email' :  email }, function(err, user) {
		        // 에러 발생 시
		        if (err) {
		            return done(err);
		        }
		        
		        // 기존에 사용자 정보가 있는 경우
		        if (user) {
		        	console.log('기존에 계정이 있음.');
		            return done(null, false, req.flash('signupMessage', '계정이 이미 있습니다.'));  // 검증 콜백에서 두 번째 파라미터의 값을 false로 하여 인증 실패한 것으로 처리
		        } else {
		        	// 모델 인스턴스 객체 만들어 저장
		        	var user = new database.UserModel({'email':email, 'password':password, 'name':paramName});
		        	user.save(function(err) {
		        		if (err) {
		        			throw err;
		        		}
		        		
		        	    console.log("사용자 데이터 추가함.");
		        	    return done(null, user);  // 검증 콜백에서 두 번째 파라미터의 값을 user 객체로 넣어 인증 성공한 것으로 처리
		        	});
		        }
		    });    
	    });

	}));
//===== 서버 시작 =====//

//확인되지 않은 예외 처리 - 서버 프로세스 종료하지 않고 유지함
process.on('uncaughtException', function (err) {
	console.log('uncaughtException 발생함 : ' + err);
	console.log('서버 프로세스 종료하지 않고 유지함.');
	
	console.log(err.stack);
});

// 프로세스 종료 시에 데이터베이스 연결 해제
process.on('SIGTERM', function () {
    console.log("프로세스가 종료됩니다.");
    app.close();
});

app.on('close', function () {
	console.log("Express 서버 객체가 종료됩니다.");
	if (database.db) {
		database.db.close();
	}
});

http.createServer(app).listen(app.get('port'), function(){
    console.log('서버시작 : ' + app.get('port'));
});