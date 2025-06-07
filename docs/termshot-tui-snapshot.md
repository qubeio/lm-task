# Okay, could you summarize that into a set of instructions for a VSCode LLM-like cursor?

To capture terminal UI (TUI) snapshots in a VSCode-like environment using `termshot`, follow these steps:

---

### **1. Set Up a Multiplexer Session**

- **Install `tmux`** (if not already installed):

```bash
sudo apt install tmux  # Debian/Ubuntu
```

- **Start a detached `tmux` session** in a virtual terminal (vty):

```bash
tmux new -d -s my_tui_session
```

---

### **2. Connect VSCode Terminal to the `tmux` Session**

- In VSCode's integrated terminal, attach to the session:

```bash
tmux attach -t my_tui_session
```

- Run your TUI (e.g., `2E`) within this session.

---

### **3. Capture the Snapshot**

- **Identify the vty number** of the `tmux` session:

```bash
ps -ft $(tmux display-message -p "#{pane_tty}") | grep tmux
```

Look for the `/dev/ttyN` value (e.g., `tty3` → vty number `3`).

- **Capture the snapshot** from another terminal tab/pane:

```bash
termshot 3 -o snapshot.png
```

---

### **Automation (Optional)**

- Use a script to trigger snapshots programmatically:

```bash
#!/bin/bash
tmux send-keys -t my_tui_session "your_tui_command" Enter
sleep 2  # Wait for TUI to load
termshot 3 -o $(date +"%s").png
```

---

### **Key Notes**

- Works best on Linux systems with direct vty access.
- For graphical terminals (e.g., VSCode’s default), `tmux` bridges the gap between the GUI and vty.
- Replace `3` with your actual vty number.
