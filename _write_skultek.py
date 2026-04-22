import os
import sys

base_dir = '/Users/lithinknasani/Documents/GitHub/skultek'

files = {}

files['lib/core/theme.dart'] = r"""import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static const primaryAdmin = Color(0xFF1E3A5F);
  static const primaryAdminLight = Color(0xFF2D5A8E);
  static const primaryStaff = Color(0xFF0F766E);
  static const primaryStaffLight = Color(0xFF14B8A6);

  static const background = Color(0xFFF8FAFC);
  static const surface = Colors.white;
  static const surfaceVariant = Color(0xFFF1F5F9);
  static const border = Color(0xFFE2E8F0);
  static const borderLight = Color(0xFFF1F5F9);

  static const textPrimary = Color(0xFF0F172A);
  static const textSecondary = Color(0xFF64748B);
  static const textTertiary = Color(0xFF94A3B8);

  static const emerald = Color(0xFF10B981);
  static const emeraldLight = Color(0xFFD1FAE5);
  static const rose = Color(0xFFF43F5E);
  static const roseLight = Color(0xFFFFE4E6);
  static const amber = Color(0xFFF59E0B);
  static const amberLight = Color(0xFFFEF3C7);
  static const blue = Color(0xFF3B82F6);
  static const blueLight = Color(0xFFDBEAFE);
  static const purple = Color(0xFF8B5CF6);
  static const purpleLight = Color(0xFFEDE9FE);
  static const indigo = Color(0xFF6366F1);
  static const indigoLight = Color(0xFFE0E7FF);
  static const orange = Color(0xFFF97316);
  static const orangeLight = Color(0xFFFFEDD5);
  static const cyan = Color(0xFF06B6D4);
  static const cyanLight = Color(0xFFCFFAFE);

  static const adminGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1E3A5F), Color(0xFF2D5A8E)],
  );
  static const staffGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF0F766E), Color(0xFF14B8A6)],
  );
}

class AppRadius {
  static const double sm = 8;
  static const double md = 12;
  static const double base = 16;
  static const double lg = 20;
  static const double xl = 24;
  static const double full = 100;
}

class AppShadows {
  static List<BoxShadow> get sm => [
    BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2)),
  ];
  static List<BoxShadow> get md => [
    BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 16, offset: const Offset(0, 4)),
  ];
  static List<BoxShadow> get lg => [
    BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 24, offset: const Offset(0, 8)),
  ];
  static List<BoxShadow> colored(Color color) => [
    BoxShadow(color: color.withOpacity(0.15), blurRadius: 20, offset: const Offset(0, 8)),
  ];
}

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primaryAdmin,
        primary: AppColors.primaryAdmin,
        secondary: AppColors.primaryStaff,
        surface: AppColors.surface,
        error: AppColors.rose,
      ),
      scaffoldBackgroundColor: AppColors.background,
      textTheme: GoogleFonts.interTextTheme().copyWith(
        displayLarge: GoogleFonts.inter(fontWeight: FontWeight.w800, color: AppColors.textPrimary, fontSize: 32),
        displayMedium: GoogleFonts.inter(fontWeight: FontWeight.w700, color: AppColors.textPrimary, fontSize: 28),
        headlineLarge: GoogleFonts.inter(fontWeight: FontWeight.w700, color: AppColors.textPrimary, fontSize: 24),
        headlineMedium: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary, fontSize: 20),
        titleLarge: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary, fontSize: 18),
        titleMedium: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.textPrimary, fontSize: 16),
        bodyLarge: GoogleFonts.inter(color: AppColors.textPrimary, fontSize: 16),
        bodyMedium: GoogleFonts.inter(color: AppColors.textSecondary, fontSize: 14),
        bodySmall: GoogleFonts.inter(color: AppColors.textTertiary, fontSize: 12),
        labelLarge: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14),
        labelMedium: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 12),
        labelSmall: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 11),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
        color: AppColors.surface,
        surfaceTintColor: Colors.transparent,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        systemOverlayStyle: SystemUiOverlayStyle.dark,
        titleTextStyle: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.base)),
          backgroundColor: AppColors.primaryAdmin,
          foregroundColor: Colors.white,
          textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceVariant,
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md), borderSide: BorderSide.none),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md), borderSide: BorderSide.none),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md), borderSide: const BorderSide(color: AppColors.primaryAdmin, width: 2)),
        errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md), borderSide: const BorderSide(color: AppColors.rose, width: 1.5)),
        labelStyle: GoogleFonts.inter(color: AppColors.textSecondary, fontSize: 14),
        hintStyle: GoogleFonts.inter(color: AppColors.textTertiary, fontSize: 14),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: AppColors.surface,
        elevation: 0,
        selectedItemColor: AppColors.primaryAdmin,
        unselectedItemColor: AppColors.textTertiary,
        type: BottomNavigationBarType.fixed,
        showUnselectedLabels: true,
        selectedLabelStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 11),
        unselectedLabelStyle: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 11),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
      ),
      dialogTheme: DialogThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.xl)),
      ),
    );
  }
}

class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final List<BoxShadow>? boxShadow;
  final Color? color;
  final double? borderRadius;

  const AppCard({super.key, required this.child, this.padding, this.boxShadow, this.color, this.borderRadius});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color ?? AppColors.surface,
        borderRadius: BorderRadius.circular(borderRadius ?? AppRadius.lg),
        boxShadow: boxShadow ?? AppShadows.sm,
      ),
      child: child,
    );
  }
}

class StatusBadge extends StatelessWidget {
  final String label;
  final Color color;
  final Color? backgroundColor;
  final IconData? icon;

  const StatusBadge({super.key, required this.label, required this.color, this.backgroundColor, this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor ?? color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppRadius.full),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[Icon(icon, size: 12, color: color), const SizedBox(width: 4)],
          Text(label, style: GoogleFonts.inter(color: color, fontWeight: FontWeight.w600, fontSize: 11)),
        ],
      ),
    );
  }
}

class EmptyStateWidget extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? action;

  const EmptyStateWidget({super.key, required this.icon, required this.title, this.subtitle, this.action});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(color: AppColors.surfaceVariant, shape: BoxShape.circle),
              child: Icon(icon, size: 48, color: AppColors.textTertiary),
            ),
            const SizedBox(height: 20),
            Text(title, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textSecondary), textAlign: TextAlign.center),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(subtitle!, style: GoogleFonts.inter(fontSize: 13, color: AppColors.textTertiary), textAlign: TextAlign.center),
            ],
            if (action != null) ...[const SizedBox(height: 20), action!],
          ],
        ),
      ),
    );
  }
}
"""

for rel_path, content in files.items():
    full_path = os.path.join(base_dir, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w') as f:
        f.write(content)
    print(f'Written: {rel_path}')

print('DONE')
