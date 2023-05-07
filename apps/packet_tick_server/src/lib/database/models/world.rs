use derive_redis_json::RedisJsonValue;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, RedisJsonValue, Debug, Clone)]
pub struct World {
    pub id: String,
    pub name: String,
    pub players: Vec<Player>,
    pub buildings: Vec<Building>,
}

#[derive(Serialize, Deserialize, RedisJsonValue, Debug, Clone)]
pub struct Player {
    pub id: String,
    pub name: String,
    pub position: Vec<f32>,
    pub inventory: Vec<InventoryItem>,
    pub socket_id: String,
    pub world_id: String,
}

#[derive(Serialize, Deserialize, RedisJsonValue, Debug, Clone)]
pub struct Building {
    pub id: String,
    pub name: String,
    pub position: Vec<f32>,
}

#[derive(Serialize, Deserialize, RedisJsonValue, Debug, Clone)]
pub struct InventoryItem {
    pub id: i32,
    pub quantity: i32,
    pub item: Item,
}

#[derive(Serialize, Deserialize, RedisJsonValue, Debug, Clone)]
pub struct Item {
    pub id: i32,
    pub name: String,
    pub display_name: String,
    pub description: String,
    pub icon: String,
    pub rarity: String,
}
