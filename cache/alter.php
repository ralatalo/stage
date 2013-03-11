<?php

# Turn off error reporting.
error_reporting(0);

# Set the response content type.
header("Content-Type: application/json");

# Request the UUID from the cookie, if not present return status -1 (failed).
if ($_COOKIE["UUID"]) {
	$uuid = $_COOKIE["UUID"];
} else {
	print '{ "status": -1 }';
	exit();
}

# Set up the database with the appcache table (if not present).
$database = new SQLite3('stage.sqlite', 0666, $error);
$query = 'CREATE TABLE appcache ' .
		 '(uuid TEXT NOT NULL, resource TEXT NOT NULL, unique (uuid, resource))';

$database->queryExec($query, $error);

# Alter the appcache table (cached content) with the provided UUID.
# The POST parameter 'resources' provides an array of new resources and
# 'garbage' to be removed resources.

# If neither are present the content of the appcache table with the
# provided UUID is emptied.

if ($_POST['resources'] || $_POST['garbage']) {
	if ($_POST['garbage']) {
		foreach ($_POST['garbage'] as $item) {
			$query = 'DELETE FROM appcache WHERE uuid="' . $uuid . '" AND resource="' . $item . '"';
			$database->queryExec($query, $error);
		}
		print '{ "status": 1 }';
	}
	if ($_POST['resources']) {
		foreach ($_POST['resources'] as $resource) {
			$query = 'INSERT OR REPLACE INTO appcache (uuid, resource) ' .
					 'VALUES ("' . $uuid . '", "' . $resource . '"); ';
			$database->queryExec($query, $error);
		}
		print '{ "status": 1 }';
	}
} else {
	$query = 'DELETE FROM appcache WHERE uuid="' . $uuid . '"';
	$database->queryExec($query, $error);
	print '{ "status": 0 }';
}

?>
