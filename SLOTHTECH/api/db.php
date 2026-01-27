<?php
$path = __DIR__ . '/../database/data.db';
try{
    $db = new PDO("sqlite:$path");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $db->exec("PRAGMA foreign_keys = ON");
}catch (Exception $e){
    die("DB error");
}