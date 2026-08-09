<?php

namespace Database\Seeders;

use App\Models\ChallanConsignee;
use App\Models\ChallanItem;
use App\Models\ChallanTransporter;
use App\Models\ChallanVendor;
use Illuminate\Database\Seeder;

class ChallanSeeder extends Seeder
{
    public function run(): void
    {
        if (ChallanConsignee::count() === 0) {
            foreach ([
                ['name' => 'ULTRATECH CEMENT LIMITED - UNIT DHAR CEMENT WORKS', 'gst' => '23AAACL6442L5ZE', 'address' => 'Village - Badnawar, Tehsil - Badnawar, District - Dhar, Madhya Pradesh - 454660', 'contact' => '07362-254000'],
                ['name' => 'ACC LIMITED - KYMORE CEMENT WORKS', 'gst' => '22AAACA1234B1Z5', 'address' => 'Kymore, District - Katni, Madhya Pradesh - 483880', 'contact' => '07622-254000'],
                ['name' => 'JAYPEE CEMENT CORPORATION LIMITED', 'gst' => '23AABCJ1234B1Z5', 'address' => 'Jaypee Nagar, Rewa, Madhya Pradesh - 486450', 'contact' => '07662-254000'],
                ['name' => 'BIRLA CORPORATION LIMITED - SATNA CEMENT WORKS', 'gst' => '23AABCB1234B1Z5', 'address' => 'Satna, Madhya Pradesh - 485001', 'contact' => '07672-254000'],
                ['name' => 'PRISM CEMENT LIMITED', 'gst' => '23AABCP1234B1Z5', 'address' => 'Satna, Madhya Pradesh - 485001', 'contact' => '07672-254000'],
            ] as $row) {
                ChallanConsignee::create($row);
            }
        }

        if (ChallanTransporter::count() === 0) {
            foreach ([
                ['name' => 'BMR MAVEN POINT PVT LTD', 'gst' => '23AAACB1234B1Z5', 'address' => 'Vill Tint, Near Bus Stand, Khori Rewari, Haryana - 123401', 'contact' => '7496974402'],
                ['name' => 'GURU GOBIND TRANSPORT CARRIERS', 'gst' => '23AAACG1234B1Z5', 'address' => 'Indore, Madhya Pradesh - 452001', 'contact' => '0731-2540000'],
                ['name' => 'SHREE SHYAM TRANSPORT COMPANY', 'gst' => '23AAACS1234B1Z5', 'address' => 'Bhopal, Madhya Pradesh - 462001', 'contact' => '0755-2540000'],
                ['name' => 'OMKAR ROADWAYS', 'gst' => '23AAACO1234B1Z5', 'address' => 'Dewas, Madhya Pradesh - 455001', 'contact' => '07272-254000'],
                ['name' => 'SHREE KRISHNA TRANSPORT', 'gst' => '23AAACK1234B1Z5', 'address' => 'Ujjain, Madhya Pradesh - 456001', 'contact' => '0734-2540000'],
            ] as $row) {
                ChallanTransporter::create($row);
            }
        }

        if (ChallanVendor::count() === 0) {
            foreach ([
                ['name' => 'INDO TERRA PRIVATE LIMITED', 'gst' => '23AAGCI8034H1ZO', 'address' => 'Indore, Madhya Pradesh - 452001', 'contact' => '0731-2540000'],
                ['name' => 'SHREE CEMENT SUPPLIERS', 'gst' => '23AAGCS1234B1Z5', 'address' => 'Bhopal, Madhya Pradesh - 462001', 'contact' => '0755-2540000'],
                ['name' => 'MADHYA PRADESH MINERALS CORPORATION', 'gst' => '23AAGCM1234B1Z5', 'address' => 'Bhopal, Madhya Pradesh - 462001', 'contact' => '0755-2540000'],
                ['name' => 'NATIONAL MINERAL DEVELOPMENT CORPORATION', 'gst' => '23AAGCN1234B1Z5', 'address' => 'Bailadila, Chhattisgarh - 494001', 'contact' => '0788-2540000'],
                ['name' => 'STEEL AUTHORITY OF INDIA LIMITED', 'gst' => '23AAGCS5678B1Z5', 'address' => 'Bhilai, Chhattisgarh - 490001', 'contact' => '0788-2540000'],
            ] as $row) {
                ChallanVendor::create($row);
            }
        }

        if (ChallanItem::count() === 0) {
            foreach ([
                ['name' => 'OPC Cement', 'unit' => 'MT', 'weight' => 50, 'rate' => 350, 'amount' => 17500],
                ['name' => 'PPC Cement', 'unit' => 'MT', 'weight' => 50, 'rate' => 340, 'amount' => 17000],
                ['name' => 'White Cement', 'unit' => 'MT', 'weight' => 25, 'rate' => 850, 'amount' => 21250],
                ['name' => 'Clinker', 'unit' => 'MT', 'weight' => 50, 'rate' => 280, 'amount' => 14000],
                ['name' => 'Fly Ash', 'unit' => 'MT', 'weight' => 50, 'rate' => 120, 'amount' => 6000],
            ] as $row) {
                ChallanItem::create([...$row, 'hsn' => '1234567']);
            }
        }
    }
}
