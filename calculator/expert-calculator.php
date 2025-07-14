<?php
/**
 * Plugin Name:       Expert Calculator
 * Description:       Adds a cost calculation calculator via a shortcode [expert_calculator].
 * Version:           2.0 (Configurable)
 * Author:            Your Name
 */

// Prevent direct access to the file
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Main function for the shortcode that displays the calculator.
 */
function expert_calculator_shortcode_handler() {
    // 1. Определяем путь к файлу конфигурации
    $config_path = plugin_dir_path( __FILE__ ) . 'calculator-config.json';
    $calculator_config = [];

    // 2. Проверяем, существует ли файл, и читаем его
    if ( file_exists( $config_path ) ) {
        $config_json = file_get_contents( $config_path );
        // Декодируем JSON в ассоциативный массив PHP
        $calculator_config = json_decode( $config_json, true );
    } else {
        // Можно добавить обработку ошибки, если файл не найден
        return 'Error: Calculator config file not found.';
    }

    // Enqueue scripts and styles
    // Используем время модификации файла для автоматического сброса кэша браузера
    $style_version = filemtime( plugin_dir_path( __FILE__ ) . 'calculator-style.css' );
    $formulas_version = filemtime( plugin_dir_path( __FILE__ ) . 'calculator-formulas.js' );
    $script_version = filemtime( plugin_dir_path( __FILE__ ) . 'calculator-script.js' );

    wp_enqueue_style( 'expert-calculator-style', plugin_dir_url( __FILE__ ) . 'calculator-style.css', array(), $style_version );
    
    // Подключаем скрипт с формулами
    wp_enqueue_script( 'expert-calculator-formulas', plugin_dir_url( __FILE__ ) . 'calculator-formulas.js', array(), $formulas_version, true );
    
    // 3. Используем wp_localize_script для передачи нашего PHP-массива в JavaScript.
    wp_localize_script( 'expert-calculator-formulas', 'CALC_CONFIG', $calculator_config );

    // Основной скрипт теперь зависит от скрипта с формулами
    wp_enqueue_script( 'expert-calculator-script', plugin_dir_url( __FILE__ ) . 'calculator-script.js', array('expert-calculator-formulas'), $script_version, true );

    // Get the path to the template file
    $template_path = plugin_dir_path( __FILE__ ) . 'calculator-template.html';

    // Check if the template file exists
    if ( file_exists( $template_path ) ) {
        ob_start();
        include $template_path;
        return ob_get_clean();
    } else {
        return 'Error: Calculator template file not found.';
    }
}

// Register the shortcode
add_shortcode( 'expert_calculator', 'expert_calculator_shortcode_handler' );
