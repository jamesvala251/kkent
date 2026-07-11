<?php

namespace Database\Factories;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'company_name' => fake()->company(),
            'mobile' => fake()->numerify('98########'),
            'email' => fake()->safeEmail(),
            'city' => fake()->city(),
            'state' => 'Gujarat',
            'status' => 'active',
            'credit_limit' => fake()->numberBetween(10000, 500000),
        ];
    }
}
