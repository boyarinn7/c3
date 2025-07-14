<?php
/**
 * Plugin Name:       Expert Calculator
 * Description:       Adds a cost calculation calculator via a shortcode [expert_calculator].
 * Version:           1.1
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
    // Enqueue scripts and styles only when the shortcode is used
    wp_enqueue_style( 'expert-calculator-style', plugin_dir_url( __FILE__ ) . 'calculator-style.css', array(), '1.1' );
    wp_enqueue_script( 'expert-calculator-script', plugin_dir_url( __FILE__ ) . 'calculator-script.js', array(), '1.1', true );

    // Get the path to the template file
    $template_path = plugin_dir_path( __FILE__ ) . 'calculator-template.html';

    // Check if the template file exists
    if ( file_exists( $template_path ) ) {
        // Start output buffering
        ob_start();
        // Include the template file
        include $template_path;
        // Return the buffered content
        return ob_get_clean();
    } else {
        // Return an error message if the template is not found
        return 'Error: Calculator template file not found.';
    }
}

// Register the shortcode
add_shortcode( 'expert_calculator', 'expert_calculator_shortcode_handler' );
