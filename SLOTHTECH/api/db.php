<?php
$path = __DIR__ . '/../database/data.db';
try{
    $db = new PDO("sqlite:$path");
}catch (Exception $e){
    die("DB error");
}