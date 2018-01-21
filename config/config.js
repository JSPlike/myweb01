module.exports = {
    server_port : 3000,
    db_url : 'mongodb://localhost:27017/local',
    db_schemas : [
        {file : './user_schema', collection : 'user6', schemaName : 'UserSchema', modelName : 'UserModel'}
    ],
    route_info : [
    ],
    facebook : {
        clientID : '146900735972202',
        clientSecret : 'c17af534cace93f1e1c325c7c849610a',
        callbackURL : '/auth/facebook/callback'
    },
    
}