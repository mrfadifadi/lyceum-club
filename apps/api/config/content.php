<?php

$contentPath = env('CONTENT_DATA_PATH', '../web/src/data');
$isAbsolutePath = str_starts_with($contentPath, DIRECTORY_SEPARATOR)
    || preg_match('#^[A-Za-z]:[\\\\/]#', $contentPath) === 1;

return [
    'path' => $isAbsolutePath ? $contentPath : base_path($contentPath),
];
