using System;
using Azure; // Required for ETag
using Azure.Data.Tables; // Required for ITableEntity

namespace AI_Maturity_Assessment.Models // Adjust namespace as needed
{
    /// <summary>
    /// Represents the benchmark configuration entity stored in Azure Table Storage.
    /// Uses a fixed PartitionKey and RowKey for easy retrieval of the single config entry.
    /// </summary>
    public class BenchmarkEntity : ITableEntity
    {
        // PartitionKey and RowKey identify the single benchmark configuration entity.
        public string PartitionKey { get; set; } = "CONFIG"; // Fixed PartitionKey
        public string RowKey { get; set; } = "BENCHMARKS";   // Fixed RowKey

        // Timestamp and ETag are required by ITableEntity for concurrency control.
        public DateTimeOffset? Timestamp { get; set; }
        public ETag ETag { get; set; }

        // Benchmark properties (nullable ints allow checking if they were set).
        // Default values (e.g., 3) are applied if no value is found in storage.
        public int? Q3Benchmark { get; set; } = 3;
        public int? Q4Benchmark { get; set; } = 3;
        public int? Q5Benchmark { get; set; } = 3;
        public int? Q6Benchmark { get; set; } = 3;
        public int? Q7Benchmark { get; set; } = 3;
        public int? Q8Benchmark { get; set; } = 3;
        public int? Q9Benchmark { get; set; } = 3;
        public int? Q10Benchmark { get; set; } = 3;
        public int? Q11Benchmark { get; set; } = 3;
    }
}
