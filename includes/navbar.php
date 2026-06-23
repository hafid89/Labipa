<?php
$currentPage = basename($_SERVER['PHP_SELF']);
?>
<nav class="navbar">
    <div class="navbar-inner">
        <a href="/" class="navbar-brand">🌱 Plant Monitoring</a>
        <div class="navbar-links">
            <a href="/" class="<?= $currentPage === 'index.php' ? 'active' : '' ?>">Dashboard</a>
            <a href="/research.php" class="btn-dark-sm">New Research</a>
        </div>
    </div>
</nav>
<?php include __DIR__ . '/dht11_widget.php'; ?>