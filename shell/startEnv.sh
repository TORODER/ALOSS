nohup mongod --config ./database/mongod.conf > ./log/mongod.nohup.log & 

nohup redis-server ./redis/redis.conf > ./log/redis.nohup.log &