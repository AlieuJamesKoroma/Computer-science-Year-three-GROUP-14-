<?php
session_start();

/* LOGOUT */
if(isset($_GET['logout'])){
session_destroy();
header("Location: index.php");
exit;
}

/* DATABASE */

$db = new PDO("sqlite:attendance.db");
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

/* CREATE TABLES */

$db->exec("CREATE TABLE IF NOT EXISTS students(
id INTEGER PRIMARY KEY AUTOINCREMENT,
student_id TEXT,
name TEXT,
course TEXT,
level TEXT
)");

$db->exec("CREATE TABLE IF NOT EXISTS attendance(
id INTEGER PRIMARY KEY AUTOINCREMENT,
student_id INTEGER,
date TEXT,
status TEXT
)");

/* LOGIN */

if(isset($_POST['login'])){

$username=$_POST['username'];
$password=$_POST['password'];

if($username=="admin" && $password=="1234"){
$_SESSION['login']=true;
header("Location: index.php");
exit;
}else{
$error="Invalid login details";
}

}

/* ADD STUDENT */

if(isset($_POST['add_student'])){
$db->prepare("INSERT INTO students(student_id,name,course,level) VALUES(?,?,?,?)")
->execute([$_POST['sid'],$_POST['name'],$_POST['course'],$_POST['level']]);
}

/* MARK ATTENDANCE */

if(isset($_POST['mark'])){

$student=$_POST['student'];
$status=$_POST['status'];
$date=date("Y-m-d");

$check=$db->prepare("SELECT * FROM attendance WHERE student_id=? AND date=?");
$check->execute([$student,$date]);

if($check->rowCount()==0){

$db->prepare("INSERT INTO attendance(student_id,date,status) VALUES(?,?,?)")
->execute([$student,$date,$status]);

}else{

$db->prepare("UPDATE attendance SET status=? WHERE student_id=? AND date=?")
->execute([$status,$student,$date]);

}

header("Location: index.php");
exit;

}

/* DELETE */

if(isset($_GET['delete'])){
$db->exec("DELETE FROM students WHERE id=".$_GET['delete']);
header("Location: index.php");
exit;
}

/* FETCH STUDENTS */

$students=$db->query("SELECT * FROM students")->fetchAll(PDO::FETCH_ASSOC);

?>

<!DOCTYPE html>
<html>
<head>

<title>Student Attendance System</title>

<style>

body{
font-family:Arial;
margin:0;
background:linear-gradient(135deg,#1e3c72,#2a5298);
}

.container{
width:95%;
margin:auto;
background:white;
padding:20px;
margin-top:20px;
border-radius:10px;
box-shadow:0 0 20px rgba(0,0,0,0.4);
}

.login-box{
width:350px;
margin:auto;
margin-top:120px;
background:white;
padding:30px;
border-radius:10px;
box-shadow:0 0 20px rgba(0,0,0,0.4);
text-align:center;
}

input,select{
padding:8px;
margin:5px;
border-radius:5px;
border:1px solid #ccc;
}

button{
padding:6px 12px;
border:none;
border-radius:5px;
cursor:pointer;
font-weight:bold;
}

.present{background:#28a745;color:white;}
.absent{background:#dc3545;color:white;}
.late{background:#ffc107;}
.delete{background:black;color:white;}
.logout{background:#444;color:white;float:right;}

.statusP{background:#28a745;color:white;padding:4px;border-radius:4px;}
.statusA{background:#dc3545;color:white;padding:4px;border-radius:4px;}
.statusL{background:#ffc107;padding:4px;border-radius:4px;}

table{
width:100%;
border-collapse:collapse;
margin-top:20px;
}

th{
background:#003366;
color:white;
padding:10px;
}

td{
border:1px solid #ccc;
padding:8px;
text-align:center;
}

marquee{
font-size:28px;
font-weight:bold;
color:white;
background:black;
padding:10px;
}

</style>

</head>
<body>

<?php if(!isset($_SESSION['login'])){ ?>

<!-- LOGIN PAGE -->

<div class="login-box">

<h2>Admin Login</h2>

<form method="post">

<input type="text" name="username" placeholder="Username" required><br>

<input type="password" name="password" placeholder="Password" required><br><br>

<button name="login">Login</button>

</form>

<?php if(isset($error)) echo "<p style='color:red'>$error</p>"; ?>

</div>

<?php } else { ?>

<!-- DASHBOARD -->

<marquee>
COMPUTER SCIENCE STUDENT'S ATTENDANCE MANAGEMENT SYSTEM
</marquee>

<div class="container">

<a href="?logout=true"><button class="logout">Logout</button></a>

<h3>Add Student</h3>

<form method="post">

<input type="text" name="sid" placeholder="Student ID" required>

<input type="text" name="name" placeholder="Student Name" required>

<select name="course">
<option>Computer Science</option>
<option>Information Technology</option>
<option>Software Engineering</option>
</select>

<select name="level">
<option>Year 1</option>
<option>Year 2</option>
<option>Year 3</option>
<option>Year 4</option>
</select>

<button name="add_student">Add Student</button>

</form>

<h3>Attendance Dashboard</h3>

<table>

<tr>
<th>ID</th>
<th>Name</th>
<th>Course</th>
<th>Level</th>
<th>Present</th>
<th>Absent</th>
<th>Late</th>
<th>Status</th>
<th>Attendance %</th>
<th>Delete</th>
</tr>

<?php

foreach($students as $s){

$date=date("Y-m-d");

$att=$db->query("SELECT status FROM attendance 
WHERE student_id=".$s['id']." AND date='$date'")
->fetch(PDO::FETCH_ASSOC);

$status="";

if($att){

if($att['status']=="Present") $status="<span class='statusP'>Present</span>";

if($att['status']=="Absent") $status="<span class='statusA'>Absent</span>";

if($att['status']=="Late") $status="<span class='statusL'>Late</span>";

}

$total=$db->query("SELECT COUNT(*) FROM attendance 
WHERE student_id=".$s['id'])->fetchColumn();

$present=$db->query("SELECT COUNT(*) FROM attendance 
WHERE student_id=".$s['id']." AND status='Present'")->fetchColumn();

$percent=0;

if($total>0){
$percent=round(($present/$total)*100,2);
}

echo "<tr>";

echo "<td>".$s['student_id']."</td>";
echo "<td>".$s['name']."</td>";
echo "<td>".$s['course']."</td>";
echo "<td>".$s['level']."</td>";

echo "<td>
<form method='post'>
<input type='hidden' name='student' value='".$s['id']."'>
<input type='hidden' name='status' value='Present'>
<button class='present' name='mark'>Present</button>
</form>
</td>";

echo "<td>
<form method='post'>
<input type='hidden' name='student' value='".$s['id']."'>
<input type='hidden' name='status' value='Absent'>
<button class='absent' name='mark'>Absent</button>
</form>
</td>";

echo "<td>
<form method='post'>
<input type='hidden' name='student' value='".$s['id']."'>
<input type='hidden' name='status' value='Late'>
<button class='late' name='mark'>Late</button>
</form>
</td>";

echo "<td>".$status."</td>";

echo "<td>".$percent."%</td>";

echo "<td><a href='?delete=".$s['id']."'><button class='delete'>Delete</button></a></td>";

echo "</tr>";

}

?>

</table>

</div>

<?php } ?>

</body>
</html>