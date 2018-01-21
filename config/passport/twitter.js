/**
 * 패스포트 설정 파일
 * 
 * 트위터 인증 방식에 사용되는 패스포트 설정
 *
 * @date 2016-11-10
 * @author Mike
 */

var TwitterStrategy = require('passport-twitter').Strategy;
var config = require('../config');

module.exports = function(app, passport) {
	return new TwitterStrategy({
		consumerKey: 'BL1WMBAoij2EfDWVfPF6NkHRQ',
		consumerSecret: 'Ne0FYcAbr2Ac79Qmntx0fbTaYRJLrxDw5skcPFGLbrLDqf9jOr',
		callbackURL: '/auth/twitter/callback'
	}, function(accessToken, refreshToken, profile, done) {
		console.log('passport의 facebook 호출됨.');
		console.dir(profile);
		
		var options = {
		    criteria: { 'twitter.id': profile.id }
		};
		
		var database = app.get('database');
	    database.UserModel.load(options, function (err, user) {
			if (err) return done(err);
      
			if (!user) {
				var user = new database.UserModel({
					name: profile.displayName,
			        provider: 'twitter',
			        twitter: profile._json
				});
        
				user.save(function (err) {
					if (err) console.log(err);
					return done(err, user);
				});
			} else {
				return done(err, user);
			}
	    });
	});
};
