<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $partyTable = function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('gst')->nullable();
            $table->text('address')->nullable();
            $table->string('contact')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        };

        Schema::create('challan_consignees', $partyTable);
        Schema::create('challan_transporters', $partyTable);
        Schema::create('challan_vendors', $partyTable);

        Schema::create('challan_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('unit')->default('MT');
            $table->decimal('weight', 12, 3)->default(0);
            $table->decimal('rate', 12, 2)->default(0);
            $table->decimal('amount', 14, 2)->default(0);
            $table->string('hsn')->nullable()->default('1234567');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('challans', function (Blueprint $table) {
            $table->id();
            $table->string('challan_no')->unique();
            $table->date('date');
            $table->string('consignee');
            $table->string('consignee_gst')->nullable();
            $table->text('consignee_address')->nullable();
            $table->string('transporter');
            $table->string('vendor');
            $table->string('dispatched_from');
            $table->string('lr_no')->nullable();
            $table->string('po_no')->nullable();
            $table->string('vehicle_no')->nullable();
            $table->string('e_way_bill_no')->nullable();
            $table->date('e_way_date')->nullable();
            $table->string('prepared_by')->nullable();
            $table->json('item_table')->nullable();
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->decimal('cgst', 14, 2)->default(0);
            $table->decimal('sgst', 14, 2)->default(0);
            $table->decimal('total', 14, 2)->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('challans');
        Schema::dropIfExists('challan_items');
        Schema::dropIfExists('challan_vendors');
        Schema::dropIfExists('challan_transporters');
        Schema::dropIfExists('challan_consignees');
    }
};
