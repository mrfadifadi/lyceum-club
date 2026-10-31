<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class ContentController extends Controller
{
    public function club(): JsonResponse
    {
        return $this->read('club.json');
    }

    public function events(): JsonResponse
    {
        return $this->read('events.json');
    }

    public function event(string $slug): JsonResponse
    {
        return $this->readItem('events.json', $slug);
    }

    public function news(): JsonResponse
    {
        return $this->read('news.json');
    }

    public function article(string $slug): JsonResponse
    {
        return $this->readItem('news.json', $slug);
    }

    public function formations(): JsonResponse
    {
        return $this->read('formations.json');
    }

    public function conventions(): JsonResponse
    {
        return $this->read('conventions.json');
    }

    public function convention(string $slug): JsonResponse
    {
        return $this->readItem('conventions.json', $slug);
    }

    private function read(string $filename): JsonResponse
    {
        $path = rtrim((string) config('content.path'), DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.$filename;
        if (!is_file($path) || !is_readable($path)) {
            return response()->json(['detail' => 'Content data is unavailable'], 503);
        }

        $contents = file_get_contents($path);
        if ($contents === false) {
            return response()->json(['detail' => 'Content data is unavailable'], 503);
        }

        return response()->json(json_decode($contents, true, 512, JSON_THROW_ON_ERROR));
    }

    private function readItem(string $filename, string $slug): JsonResponse
    {
        $response = $this->read($filename);
        if ($response->getStatusCode() !== 200) {
            return $response;
        }

        $content = $response->getData(true);
        if (!is_array($content)) {
            return response()->json(['detail' => 'Content not found'], 404);
        }

        foreach ($content as $item) {
            if (is_array($item) && ($item['slug'] ?? null) === $slug) {
                return response()->json($item);
            }
        }

        return response()->json(['detail' => 'Content not found'], 404);
    }
}
