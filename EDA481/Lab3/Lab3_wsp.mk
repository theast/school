.PHONY: clean All

All:
	@echo "----------Building project:[ tolka_morse - Release ]----------"
	@cd "tolka_morse" && $(MAKE) -f  "tolka_morse.mk"
clean:
	@echo "----------Cleaning project:[ tolka_morse - Release ]----------"
	@cd "tolka_morse" && $(MAKE) -f  "tolka_morse.mk" clean
