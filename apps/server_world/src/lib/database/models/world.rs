use derive_redis_json::RedisJsonValue;
use serde::{Serialize, Deserialize};


#[derive(Serialize, Deserialize, RedisJsonValue, Debug)]
pub struct World {
    pub id: String,
    pub name: String,
    pub players : Vec<Player>,
    pub buildings : Vec<Building>,
}

#[derive(Serialize, Deserialize, RedisJsonValue, Debug)]
pub struct Player {
  pub id: String,
  pub name: String,
  pub position: Vec<f32>,
  pub socket_id: String,
  pub world_id: String,
}


#[derive(Serialize, Deserialize, RedisJsonValue, Debug)]
pub struct Building {
  pub id: String,
  pub name: String,
  pub position: Vec<f32>,
}

