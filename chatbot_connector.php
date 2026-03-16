<?php

$url = "https://bidig.areandina.edu.co";

// Descargar el contenido de la página
$html = @file_get_contents($url);

if ($html === false) {
    $respuesta = "No pude acceder a la biblioteca virtual.";
} else {
    // Extraer solo <body>
    if (preg_match('/<body.*?>(.*)<\/body>/is', $html, $matches)) {
        $texto = strip_tags($matches[1]);
    } else {
        $texto = strip_tags($html);
    }

    // Limpiar texto (sin CSS, sin saltos raros)
    $texto = preg_replace('/\s+/', ' ', $texto);

    // Dividir en párrafos o bloques de contenido
    $bloques = preg_split('/(?<=\.)\s+/', $texto);

    // Obtener pregunta desde frontend (JSON o POST)
    $inputJSON = file_get_contents("php://input");
    $input = json_decode($inputJSON, true);
    $pregunta = strtolower($input['message'] ?? $_POST['q'] ?? $_GET['q'] ?? null);

    if ($pregunta) {
        // Reducir la pregunta a palabras clave (quitamos "qué es", "quién es", etc.)
        $clave = preg_replace('/(qué es|quien es|dime sobre|que significa)/i', '', $pregunta);
        $clave = trim($clave);

        $respuesta = "No encontré información sobre eso en la biblioteca.";

        foreach ($bloques as $bloque) {
            if (stripos($bloque, $clave) !== false) {
                $respuesta = trim($bloque);
                break; // solo el primer resultado relevante
            }
        }
    } else {
        $respuesta = "No se recibió ninguna pregunta.";
    }
}

header('Content-Type: application/json');
echo json_encode(["reply" => $respuesta]);

?>
