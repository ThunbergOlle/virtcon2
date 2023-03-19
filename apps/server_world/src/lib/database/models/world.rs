use derive_redis_json::RedisJsonValue;
use serde::{Serialize, Deserialize};


#[derive(Serialize, Deserialize, RedisJsonValue)]
pub struct World {
    pub id: String,
    pub name: String,
}
