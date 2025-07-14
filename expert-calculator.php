<?php
/**
 * Plugin Name:       Expert Calculator
 * Description:       Adds a cost calculation calculator via a shortcode [expert_calculator].
 * Version:           1.4 (Stable)
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
    // Enqueue scripts and styles only when the shortcode is used.
    // We add a version number based on the file's modification time to automatically bust browser cache.
    $style_version = filemtime( plugin_dir_path( __FILE__ ) . 'calculator-style.css' );
    $script_version = filemtime( plugin_dir_path( __FILE__ ) . 'calculator-script.js' );

    wp_enqueue_style( 'expert-calculator-style', plugin_dir_url( __FILE__ ) . 'calculator-style.css', array(), $style_version );
    wp_enqueue_script( 'expert-calculator-script', plugin_dir_url( __FILE__ ) . 'calculator-script.js', array(), $script_version, true );

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
