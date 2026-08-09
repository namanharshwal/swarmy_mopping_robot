import time
import json

def get_cpu_times():
    times = []
    with open('/proc/stat', 'r') as f:
        for line in f:
            if line.startswith('cpu') and line.split()[0] != 'cpu':
                parts = [float(x) for x in line.split()[1:]]
                idle = parts[3] + parts[4]
                total = sum(parts)
                times.append((idle, total))
    return times

t1 = get_cpu_times()
time.sleep(0.2)
t2 = get_cpu_times()

cores = []
for i in range(len(t1)):
    idle_d = t2[i][0] - t1[i][0]
    total_d = t2[i][1] - t1[i][1]
    usage = 0.0
    if total_d > 0:
        usage = (1.0 - idle_d / total_d) * 100
    cores.append(round(usage, 1))

print(json.dumps(cores))
